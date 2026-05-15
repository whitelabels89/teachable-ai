import { useState, useCallback, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  isTraining: boolean;
  phase: string;
}

export interface ClassData {
  id: string;
  name: string;
  samples: Array<{
    id: string | number;
    data: string;
    type: string;
    timestamp: number;
  }>;
}

export interface PredictionResult {
  label: string;
  confidence: number;
}

const MOBILE_NET_URL = "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";
const IMAGE_SIZE = 224;
const TOTAL_EPOCHS = 35;

export function useTensorFlow() {
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [baseModel, setBaseModel] = useState<tf.LayersModel | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [classLabels, setClassLabels] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initializeTensorFlow = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
      } catch {
        await tf.setBackend("cpu");
        await tf.ready();
      }

      if (!isMounted) {
        return;
      }
    };

    initializeTensorFlow().catch((error) => {
      console.error("TensorFlow initialization failed:", error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadBaseModel = useCallback(async () => {
    if (baseModel) {
      return baseModel;
    }

    const mobilenet = await tf.loadLayersModel(MOBILE_NET_URL);
    const layer = mobilenet.getLayer("conv_pw_13_relu");
    const featureExtractor = tf.model({
      inputs: mobilenet.input,
      outputs: layer.output,
    });

    featureExtractor.trainable = false;
    setBaseModel(featureExtractor);
    return featureExtractor;
  }, [baseModel]);

  const preprocessImage = useCallback(async (imageDataUrl: string): Promise<tf.Tensor4D> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Canvas context tidak tersedia");
          }

          canvas.width = IMAGE_SIZE;
          canvas.height = IMAGE_SIZE;
          ctx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

          const tensor = tf.browser
            .fromPixels(canvas)
            .toFloat()
            .div(255)
            .expandDims(0) as tf.Tensor4D;

          resolve(tensor);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = imageDataUrl;
    });
  }, []);

  const extractFeatures = useCallback(
    async (imageDataUrl: string): Promise<tf.Tensor3D> => {
      const base = await loadBaseModel();
      const preprocessed = await preprocessImage(imageDataUrl);

      try {
        const predicted = base.predict(preprocessed) as tf.Tensor4D;
        const squeezed = predicted.squeeze([0]) as tf.Tensor3D;
        predicted.dispose();
        return squeezed;
      } finally {
        preprocessed.dispose();
      }
    },
    [loadBaseModel, preprocessImage],
  );

  const trainModel = useCallback(
    async (classes: ClassData[]) => {
      const usableClasses = classes.filter((cls) => cls.samples.length > 0);

      if (usableClasses.length < 2) {
        throw new Error("Minimal 2 kelas dengan sampel diperlukan untuk training.");
      }

      if (usableClasses.some((cls) => cls.samples.length < 2)) {
        throw new Error("Setiap kelas minimal harus punya 2 gambar sampel.");
      }

      const totalSamples = usableClasses.reduce((sum, cls) => sum + cls.samples.length, 0);
      const features: tf.Tensor3D[] = [];
      const labelIndices: number[] = [];

      let xs: tf.Tensor4D | null = null;
      let ys: tf.Tensor2D | null = null;

      setIsLoading(true);
      setIsModelTrained(false);
      setClassLabels(usableClasses.map((cls) => cls.name));
      setTrainingProgress({
        epoch: 0,
        totalEpochs: TOTAL_EPOCHS,
        loss: 0,
        accuracy: 0,
        isTraining: true,
        phase: `Ekstraksi fitur gambar (0/${totalSamples})`,
      });

      try {
        let processedSamples = 0;

        for (let classIndex = 0; classIndex < usableClasses.length; classIndex += 1) {
          const currentClass = usableClasses[classIndex];

          for (const sample of currentClass.samples) {
            const feature = await extractFeatures(sample.data);
            features.push(feature);
            labelIndices.push(classIndex);
            processedSamples += 1;

            setTrainingProgress((prev) =>
              prev
                ? {
                    ...prev,
                    phase: `Ekstraksi fitur gambar (${processedSamples}/${totalSamples})`,
                  }
                : prev,
            );
          }
        }

        if (features.length < 4) {
          throw new Error("Jumlah sampel valid terlalu sedikit. Tambahkan data lalu coba lagi.");
        }

        xs = tf.stack(features) as tf.Tensor4D;
        const labelTensor = tf.tensor1d(labelIndices, "int32");
        ys = tf.oneHot(labelTensor, usableClasses.length) as tf.Tensor2D;
        labelTensor.dispose();

        const transferModel = tf.sequential({
          layers: [
            tf.layers.flatten({ inputShape: xs.shape.slice(1) }),
            tf.layers.dense({ units: 128, activation: "relu" }),
            tf.layers.dropout({ rate: 0.25 }),
            tf.layers.dense({ units: 64, activation: "relu" }),
            tf.layers.dense({ units: usableClasses.length, activation: "softmax" }),
          ],
        });

        transferModel.compile({
          optimizer: tf.train.adam(0.001),
          loss: "categoricalCrossentropy",
          metrics: ["accuracy"],
        });

        const batchSize = Math.max(1, Math.min(16, Math.floor(features.length / 3)));
        const validationSplit = features.length >= 10 ? 0.2 : features.length >= 6 ? 0.1 : 0;

        setTrainingProgress((prev) =>
          prev
            ? {
                ...prev,
                phase: "Training model...",
              }
            : prev,
        );

        await transferModel.fit(xs, ys, {
          epochs: TOTAL_EPOCHS,
          batchSize,
          validationSplit,
          shuffle: true,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              const accuracy = (logs?.accuracy as number | undefined) ?? (logs?.acc as number | undefined) ?? 0;

              setTrainingProgress({
                epoch: epoch + 1,
                totalEpochs: TOTAL_EPOCHS,
                loss: logs?.loss ?? 0,
                accuracy,
                isTraining: true,
                phase: "Training model...",
              });
            },
          },
        });

        setModel((prev) => {
          if (prev) {
            prev.dispose();
          }
          return transferModel;
        });

        setIsModelTrained(true);
        setTrainingProgress((prev) =>
          prev
            ? {
                ...prev,
                isTraining: false,
                phase: "Training selesai",
              }
            : null,
        );

        return transferModel;
      } catch (error) {
        setTrainingProgress((prev) =>
          prev
            ? {
                ...prev,
                isTraining: false,
                phase: "Training gagal",
              }
            : null,
        );
        throw error;
      } finally {
        features.forEach((tensor) => tensor.dispose());
        xs?.dispose();
        ys?.dispose();
        setIsLoading(false);
      }
    },
    [extractFeatures],
  );

  const predictImage = useCallback(
    async (imageDataUrl: string): Promise<PredictionResult[]> => {
      if (!model || !isModelTrained) {
        throw new Error("Model belum dilatih.");
      }

      setIsLoading(true);
      try {
        const base = await loadBaseModel();
        const preprocessed = await preprocessImage(imageDataUrl);

        try {
          const features = base.predict(preprocessed) as tf.Tensor4D;
          const prediction = model.predict(features) as tf.Tensor2D;
          const probabilities = Array.from(await prediction.data());

          features.dispose();
          prediction.dispose();

          return classLabels
            .map((label, index) => ({
              label,
              confidence: probabilities[index] ?? 0,
            }))
            .sort((a, b) => b.confidence - a.confidence);
        } finally {
          preprocessed.dispose();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [model, isModelTrained, classLabels, loadBaseModel, preprocessImage],
  );

  const saveModel = useCallback(
    async (name: string): Promise<void> => {
      if (!model || !isModelTrained) {
        throw new Error("Tidak ada model terlatih untuk disimpan.");
      }

      setIsLoading(true);
      try {
        await model.save(`indexeddb://${name}`);
        localStorage.setItem(`${name}_labels`, JSON.stringify(classLabels));
      } finally {
        setIsLoading(false);
      }
    },
    [model, isModelTrained, classLabels],
  );

  const loadModel = useCallback(async (name: string): Promise<void> => {
    setIsLoading(true);
    try {
      const loadedModel = await tf.loadLayersModel(`indexeddb://${name}`);
      const labelsRaw = localStorage.getItem(`${name}_labels`);

      if (!labelsRaw) {
        loadedModel.dispose();
        throw new Error("Label kelas model tidak ditemukan.");
      }

      const labels = JSON.parse(labelsRaw) as string[];

      setModel((prev) => {
        if (prev) {
          prev.dispose();
        }
        return loadedModel;
      });

      setClassLabels(labels);
      setIsModelTrained(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadModel = useCallback(async (): Promise<void> => {
    if (!model || !isModelTrained) {
      throw new Error("Tidak ada model terlatih untuk diunduh.");
    }

    setIsLoading(true);
    try {
      await model.save("downloads://teachable-ai-model");

      const labelsBlob = new Blob([JSON.stringify(classLabels, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(labelsBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "teachable-ai-labels.json";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } finally {
      setIsLoading(false);
    }
  }, [model, isModelTrained, classLabels]);

  const resetModel = useCallback(() => {
    setModel((prev) => {
      if (prev) {
        prev.dispose();
      }
      return null;
    });

    setIsModelTrained(false);
    setClassLabels([]);
    setTrainingProgress(null);
  }, []);

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
    loadBaseModel,
  };
}
