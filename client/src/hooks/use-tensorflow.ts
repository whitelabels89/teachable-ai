import { useState, useCallback, useEffect, useRef } from "react";
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

export interface SavedImageModel {
  id: string;
  name: string;
  labels: string[];
  createdAt: number;
  updatedAt: number;
  sampleCount: number;
}

interface SaveModelOptions {
  sampleCount?: number;
}

const MOBILE_NET_URL = "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";
const IMAGE_SIZE = 224;
const TOTAL_EPOCHS = 35;

const MODEL_REGISTRY_KEY = "teachable-ai:image-model-registry:v1";
const MODEL_STORAGE_PREFIX = "teachable-ai-image-model:";
const MODEL_LABELS_KEY_PREFIX = "teachable-ai:image-model-labels:";

const buildModelUrl = (id: string) => `indexeddb://${MODEL_STORAGE_PREFIX}${id}`;
const buildLabelKey = (id: string) => `${MODEL_LABELS_KEY_PREFIX}${id}`;

const safeJsonParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readRegistry = (): SavedImageModel[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = safeJsonParse<SavedImageModel[]>(localStorage.getItem(MODEL_REGISTRY_KEY), []);
  return parsed.filter((item) => item && typeof item.id === "string" && typeof item.name === "string");
};

const writeRegistry = (records: SavedImageModel[]) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(MODEL_REGISTRY_KEY, JSON.stringify(records));
};

const sortRegistry = (records: SavedImageModel[]) => [...records].sort((a, b) => b.updatedAt - a.updatedAt);

const generateModelId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useTensorFlow() {
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [baseModel, setBaseModel] = useState<tf.LayersModel | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [classLabels, setClassLabels] = useState<string[]>([]);
  const [savedModels, setSavedModels] = useState<SavedImageModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  const modelRef = useRef<tf.LayersModel | null>(null);
  const baseModelRef = useRef<tf.LayersModel | null>(null);
  const baseModelLoadPromiseRef = useRef<Promise<tf.LayersModel> | null>(null);

  const replaceActiveModel = useCallback((nextModel: tf.LayersModel | null) => {
    if (modelRef.current && modelRef.current !== nextModel) {
      modelRef.current.dispose();
    }

    modelRef.current = nextModel;
    setModel(nextModel);
  }, []);

  const refreshSavedModels = useCallback(async () => {
    const localRegistry = sortRegistry(readRegistry());

    try {
      const availableModels = await tf.io.listModels();
      const filtered = localRegistry.filter((item) => Boolean(availableModels[buildModelUrl(item.id)]));

      if (filtered.length !== localRegistry.length) {
        writeRegistry(filtered);
      }

      setSavedModels(sortRegistry(filtered));
      return sortRegistry(filtered);
    } catch {
      setSavedModels(localRegistry);
      return localRegistry;
    }
  }, []);

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

      await refreshSavedModels();
    };

    initializeTensorFlow().catch((error) => {
      console.error("TensorFlow initialization failed:", error);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshSavedModels]);

  const loadBaseModel = useCallback(async () => {
    if (baseModelRef.current) {
      return baseModelRef.current;
    }

    if (baseModelLoadPromiseRef.current) {
      return baseModelLoadPromiseRef.current;
    }

    baseModelLoadPromiseRef.current = (async () => {
      const mobilenet = await tf.loadLayersModel(MOBILE_NET_URL);
      const layer = mobilenet.getLayer("conv_pw_13_relu");
      const featureExtractor = tf.model({
        inputs: mobilenet.input,
        outputs: layer.output,
      });

      featureExtractor.trainable = false;
      baseModelRef.current = featureExtractor;
      setBaseModel(featureExtractor);
      return featureExtractor;
    })();

    try {
      return await baseModelLoadPromiseRef.current;
    } finally {
      baseModelLoadPromiseRef.current = null;
    }
  }, []);

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
      setActiveModelId(null);
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

        replaceActiveModel(transferModel);

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
    [extractFeatures, replaceActiveModel],
  );

  const predictImage = useCallback(
    async (imageDataUrl: string): Promise<PredictionResult[]> => {
      const currentModel = modelRef.current;
      if (!currentModel || !isModelTrained) {
        throw new Error("Model belum dilatih.");
      }

      setIsLoading(true);
      try {
        const base = await loadBaseModel();
        const preprocessed = await preprocessImage(imageDataUrl);

        try {
          const features = base.predict(preprocessed) as tf.Tensor4D;
          const prediction = currentModel.predict(features) as tf.Tensor2D;
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
    [isModelTrained, classLabels, loadBaseModel, preprocessImage],
  );

  const saveModel = useCallback(
    async (name: string, options?: SaveModelOptions): Promise<SavedImageModel> => {
      const currentModel = modelRef.current;
      if (!currentModel || !isModelTrained) {
        throw new Error("Tidak ada model terlatih untuk disimpan.");
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Nama model tidak boleh kosong.");
      }

      const modelId = generateModelId();
      const now = Date.now();
      const record: SavedImageModel = {
        id: modelId,
        name: trimmedName,
        labels: classLabels,
        createdAt: now,
        updatedAt: now,
        sampleCount: options?.sampleCount ?? 0,
      };

      setIsLoading(true);
      try {
        await currentModel.save(buildModelUrl(modelId));
        localStorage.setItem(buildLabelKey(modelId), JSON.stringify(classLabels));

        const updatedRegistry = sortRegistry([record, ...readRegistry()]);
        writeRegistry(updatedRegistry);
        setSavedModels(updatedRegistry);
        setActiveModelId(modelId);

        return record;
      } finally {
        setIsLoading(false);
      }
    },
    [isModelTrained, classLabels],
  );

  const loadModel = useCallback(
    async (modelId: string): Promise<SavedImageModel | null> => {
      setIsLoading(true);
      try {
        const loadedModel = await tf.loadLayersModel(buildModelUrl(modelId));
        const registry = readRegistry();
        const existingRecord = registry.find((item) => item.id === modelId) ?? null;

        const labelsFromStorage = safeJsonParse<string[]>(localStorage.getItem(buildLabelKey(modelId)), []);
        const labels = labelsFromStorage.length > 0 ? labelsFromStorage : existingRecord?.labels ?? [];

        if (labels.length === 0) {
          loadedModel.dispose();
          throw new Error("Label kelas model tidak ditemukan.");
        }

        replaceActiveModel(loadedModel);
        setClassLabels(labels);
        setIsModelTrained(true);
        setTrainingProgress(null);
        setActiveModelId(modelId);

        if (existingRecord) {
          const updatedRecord: SavedImageModel = {
            ...existingRecord,
            labels,
            updatedAt: Date.now(),
          };

          const updatedRegistry = sortRegistry([
            updatedRecord,
            ...registry.filter((item) => item.id !== modelId),
          ]);
          writeRegistry(updatedRegistry);
          setSavedModels(updatedRegistry);
          return updatedRecord;
        }

        await refreshSavedModels();
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [replaceActiveModel, refreshSavedModels],
  );

  const deleteSavedModel = useCallback(
    async (modelId: string): Promise<void> => {
      setIsLoading(true);
      try {
        try {
          await tf.io.removeModel(buildModelUrl(modelId));
        } catch {
          // ignore missing model in IndexedDB
        }

        localStorage.removeItem(buildLabelKey(modelId));

        const remaining = readRegistry().filter((item) => item.id !== modelId);
        writeRegistry(remaining);
        setSavedModels(sortRegistry(remaining));

        if (activeModelId === modelId) {
          replaceActiveModel(null);
          setIsModelTrained(false);
          setClassLabels([]);
          setTrainingProgress(null);
          setActiveModelId(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [activeModelId, replaceActiveModel],
  );

  const downloadModel = useCallback(async (): Promise<void> => {
    const currentModel = modelRef.current;
    if (!currentModel || !isModelTrained) {
      throw new Error("Tidak ada model terlatih untuk diunduh.");
    }

    setIsLoading(true);
    try {
      await currentModel.save("downloads://teachable-ai-model");

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
  }, [isModelTrained, classLabels]);

  const resetModel = useCallback(() => {
    replaceActiveModel(null);
    setIsModelTrained(false);
    setClassLabels([]);
    setTrainingProgress(null);
    setActiveModelId(null);
  }, [replaceActiveModel]);

  useEffect(() => {
    return () => {
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }

      if (baseModelRef.current) {
        baseModelRef.current.dispose();
        baseModelRef.current = null;
      }
    };
  }, []);

  return {
    isLoading,
    model,
    baseModel,
    isModelTrained,
    trainingProgress,
    classLabels,
    savedModels,
    activeModelId,
    trainModel,
    predictImage,
    saveModel,
    loadModel,
    deleteSavedModel,
    refreshSavedModels,
    downloadModel,
    resetModel,
    loadBaseModel,
  };
}
