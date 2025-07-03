import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  isTraining: boolean;
}

interface ClassData {
  id: string;
  name: string;
  samples: Array<{
    id: string | number;
    data: string;
    type: string;
    timestamp: number;
  }>;
}

export function useTensorFlow() {
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [baseModel, setBaseModel] = useState<tf.LayersModel | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [classLabels, setClassLabels] = useState<string[]>([]);

  // Initialize TensorFlow.js and load base model
  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        // Set backend to WebGL for better performance
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js initialized successfully');
      } catch (error) {
        console.error('Failed to initialize TensorFlow.js:', error);
        // Fallback to CPU backend
        try {
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('TensorFlow.js initialized with CPU backend');
        } catch (cpuError) {
          console.error('Failed to initialize TensorFlow.js with CPU backend:', cpuError);
        }
      }
    };

    initializeTensorFlow();
  }, []);

  const loadBaseModel = useCallback(async () => {
    if (baseModel) return baseModel;

    try {
      setIsLoading(true);
      
      // Load MobileNet v2 as base model for transfer learning
      const mobilenet = await tf.loadLayersModel(
        'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
      );
      
      // Get the feature layer (before the final classification layer)
      const layer = mobilenet.getLayer('conv_pw_13_relu');
      const featureExtractor = tf.model({
        inputs: mobilenet.input,
        outputs: layer.output
      });
      
      setBaseModel(featureExtractor);
      console.log('Base model loaded successfully');
      return featureExtractor;
    } catch (error) {
      console.error('Error loading base model:', error);
      throw new Error('Failed to load base model for transfer learning');
    } finally {
      setIsLoading(false);
    }
  }, [baseModel]);

  const preprocessImage = useCallback(async (imageDataUrl: string): Promise<tf.Tensor> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas to resize and preprocess image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          // Resize to 224x224 (MobileNet input size)
          canvas.width = 224;
          canvas.height = 224;
          ctx.drawImage(img, 0, 0, 224, 224);

          // Convert to tensor and normalize
          const tensor = tf.browser.fromPixels(canvas)
            .expandDims(0)
            .cast('float32')
            .div(255.0); // Normalize to [0, 1]

          resolve(tensor);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  }, []);

  const extractFeatures = useCallback(async (imageDataUrl: string): Promise<tf.Tensor> => {
    const base = await loadBaseModel();
    const preprocessed = await preprocessImage(imageDataUrl);
    
    try {
      const features = base.predict(preprocessed) as tf.Tensor;
      preprocessed.dispose(); // Clean up memory
      return features;
    } catch (error) {
      preprocessed.dispose();
      throw error;
    }
  }, [loadBaseModel, preprocessImage]);

  const trainModel = useCallback(async (classes: ClassData[]) => {
    if (classes.length < 2) {
      throw new Error('At least 2 classes are required for training');
    }

    if (classes.some(cls => cls.samples.length === 0)) {
      throw new Error('All classes must have at least one sample');
    }

    try {
      setIsLoading(true);
      setIsModelTrained(false);
      
      // Prepare class labels
      const labels = classes.map(cls => cls.name);
      setClassLabels(labels);

      // Extract features from all images
      const features: tf.Tensor[] = [];
      const labelIndices: number[] = [];

      setTrainingProgress({
        epoch: 0,
        totalEpochs: 50,
        loss: 1.0,
        accuracy: 0,
        isTraining: true
      });

      for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        const cls = classes[classIndex];
        for (const sample of cls.samples) {
          try {
            const feature = await extractFeatures(sample.data);
            features.push(feature);
            labelIndices.push(classIndex);
          } catch (error) {
            console.error(`Error processing sample ${sample.id}:`, error);
            // Continue with other samples
          }
        }
      }

      if (features.length === 0) {
        throw new Error('No valid samples found for training');
      }

      // Stack features and create one-hot encoded labels
      const xs = tf.stack(features);
      const ys = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), classes.length);

      // Clean up individual feature tensors
      features.forEach(f => f.dispose());

      // Create transfer learning model
      const transferModel = tf.sequential({
        layers: [
          tf.layers.flatten({ inputShape: xs.shape.slice(1) }),
          tf.layers.dense({ units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: classes.length, activation: 'softmax' })
        ]
      });

      // Compile model
      transferModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Train the model with progress callbacks
      const history = await transferModel.fit(xs, ys, {
        epochs: 50,
        batchSize: Math.min(16, Math.floor(features.length / 2)),
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            setTrainingProgress({
              epoch: epoch + 1,
              totalEpochs: 50,
              loss: logs?.loss || 0,
              accuracy: logs?.acc || logs?.accuracy || 0,
              isTraining: true
            });
          }
        }
      });

      // Clean up training data
      xs.dispose();
      ys.dispose();

      setModel(transferModel);
      setIsModelTrained(true);
      setTrainingProgress(prev => prev ? { ...prev, isTraining: false } : null);
      
      console.log('Model training completed successfully');
      return transferModel;

    } catch (error) {
      console.error('Error during model training:', error);
      setTrainingProgress(prev => prev ? { ...prev, isTraining: false } : null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [extractFeatures]);

  const predictImage = useCallback(async (imageDataUrl: string): Promise<Array<{ label: string; confidence: number }>> => {
    if (!model || !isModelTrained) {
      throw new Error('Model is not trained yet');
    }

    try {
      setIsLoading(true);
      
      const base = await loadBaseModel();
      const preprocessed = await preprocessImage(imageDataUrl);
      
      // Extract features
      const features = base.predict(preprocessed) as tf.Tensor;
      
      // Make prediction
      const prediction = model.predict(features) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Clean up tensors
      preprocessed.dispose();
      features.dispose();
      prediction.dispose();

      // Create results array
      const results = classLabels.map((label, index) => ({
        label,
        confidence: probabilities[index]
      }));

      // Sort by confidence descending
      results.sort((a, b) => b.confidence - a.confidence);

      return results;
    } catch (error) {
      console.error('Error during prediction:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [model, isModelTrained, classLabels, loadBaseModel, preprocessImage]);

  const saveModel = useCallback(async (name: string): Promise<void> => {
    if (!model || !isModelTrained) {
      throw new Error('No trained model to save');
    }

    try {
      setIsLoading(true);
      
      // Save model to IndexedDB
      await model.save(`indexeddb://${name}`);
      
      // Save class labels separately
      localStorage.setItem(`${name}_labels`, JSON.stringify(classLabels));
      
      console.log(`Model saved as ${name}`);
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [model, isModelTrained, classLabels]);

  const loadModel = useCallback(async (name: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Load model from IndexedDB
      const loadedModel = await tf.loadLayersModel(`indexeddb://${name}`);
      
      // Load class labels
      const labelsJson = localStorage.getItem(`${name}_labels`);
      if (!labelsJson) {
        throw new Error('Class labels not found for this model');
      }
      
      const labels = JSON.parse(labelsJson);
      
      setModel(loadedModel);
      setClassLabels(labels);
      setIsModelTrained(true);
      
      console.log(`Model ${name} loaded successfully`);
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadModel = useCallback(async (): Promise<void> => {
    if (!model || !isModelTrained) {
      throw new Error('No trained model to download');
    }

    try {
      setIsLoading(true);
      
      // Save to downloads (browser will handle the download)
      await model.save('downloads://my-ai-model');
      
      // Also save class labels as JSON file
      const labelsBlob = new Blob([JSON.stringify(classLabels, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(labelsBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'class-labels.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Model downloaded successfully');
    } catch (error) {
      console.error('Error downloading model:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [model, isModelTrained, classLabels]);

  const resetModel = useCallback(() => {
    if (model) {
      model.dispose();
      setModel(null);
    }
    setIsModelTrained(false);
    setClassLabels([]);
    setTrainingProgress(null);
  }, [model]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (model) {
        model.dispose();
      }
      if (baseModel) {
        baseModel.dispose();
      }
    };
  }, [model, baseModel]);

  return {
    isLoading,
    model,
    isModelTrained,
    trainingProgress,
    classLabels,
    trainModel,
    predictImage,
    saveModel,
    loadModel,
    downloadModel,
    resetModel,
    loadBaseModel
  };
}
