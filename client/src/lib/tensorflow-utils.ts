import * as tf from '@tensorflow/tfjs';

export class TensorFlowUtils {
  private model: tf.LayersModel | null = null;
  private labels: string[] = [];

  async loadMobileNet() {
    try {
      // Load MobileNet base model for transfer learning
      const baseModel = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
      
      // Create a new model using the base model layers (excluding the final classification layer)
      const layer = baseModel.getLayer('conv_pw_13_relu');
      const truncatedModel = tf.model({ inputs: baseModel.input, outputs: layer.output });
      
      return truncatedModel;
    } catch (error) {
      console.error('Error loading MobileNet:', error);
      throw error;
    }
  }

  async createTransferLearningModel(numClasses: number) {
    try {
      const baseModel = await this.loadMobileNet();
      
      // Create a new model for transfer learning
      const model = tf.sequential({
        layers: [
          tf.layers.flatten({ inputShape: baseModel.outputShape.slice(1) }),
          tf.layers.dense({ units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: numClasses, activation: 'softmax' })
        ]
      });

      // Compile the model
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
      return model;
    } catch (error) {
      console.error('Error creating transfer learning model:', error);
      throw error;
    }
  }

  async preprocessImage(imageData: string): Promise<tf.Tensor> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas to resize image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          // Resize to 224x224 (MobileNet input size)
          canvas.width = 224;
          canvas.height = 224;
          ctx.drawImage(img, 0, 0, 224, 224);

          // Convert to tensor
          const tensor = tf.browser.fromPixels(canvas)
            .expandDims(0)
            .cast('float32')
            .div(255.0); // Normalize to [0, 1]

          resolve(tensor);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = imageData;
    });
  }

  async trainModel(
    trainingData: tf.Tensor, 
    trainingLabels: tf.Tensor, 
    validationData?: tf.Tensor,
    validationLabels?: tf.Tensor,
    onEpochEnd?: (epoch: number, logs: any) => void
  ) {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const history = await this.model.fit(trainingData, trainingLabels, {
      epochs: 50,
      batchSize: 32,
      validationData: validationData && validationLabels ? [validationData, validationLabels] : undefined,
      shuffle: true,
      callbacks: onEpochEnd ? {
        onEpochEnd: (epoch, logs) => {
          onEpochEnd(epoch, logs);
        }
      } : undefined
    });

    return history;
  }

  async predict(imageData: string): Promise<{ label: string; confidence: number }[]> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const tensor = await this.preprocessImage(imageData);
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const probabilities = await prediction.data();
    
    // Clean up tensors
    tensor.dispose();
    prediction.dispose();

    // Create result array
    const results = this.labels.map((label, index) => ({
      label,
      confidence: probabilities[index]
    }));

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
  }

  async saveModel(name: string): Promise<string> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    try {
      // Save model to IndexedDB
      const saveResult = await this.model.save(`indexeddb://${name}`);
      return `Model saved to IndexedDB: ${name}`;
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  async loadModel(name: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`indexeddb://${name}`);
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  setLabels(labels: string[]) {
    this.labels = labels;
  }

  getLabels(): string[] {
    return this.labels;
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

// Export singleton instance
export const tensorFlowUtils = new TensorFlowUtils();
