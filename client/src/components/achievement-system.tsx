import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getUserProgress, getAchievements } from "@/lib/storage-utils";
import { Lock } from "lucide-react";

export default function AchievementSystem() {
  const { data: progress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: getUserProgress,
    staleTime: 300000,
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
    staleTime: 300000,
  });

  const displayAchievements = achievements?.slice(0, 4) || [];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-fredoka text-dark-text mb-4">Pencapaian & Lencana</h2>
          <p className="text-gray-600 text-lg">Kumpulkan lencana keren dengan menyelesaikan proyek-proyek AI!</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayAchievements.map((achievement) => (
            <Card 
              key={achievement.id}
              className={`rounded-3xl shadow-xl text-center p-6 ${
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-sunny-yellow to-orange' 
                  : 'bg-gray-400 opacity-60'
              }`}
            >
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                  {achievement.unlocked ? achievement.icon : <Lock className="text-gray-400" />}
                </div>
                <h3 className="text-lg font-fredoka text-white mb-2">{achievement.title}</h3>
                <p className="text-white opacity-90 text-sm mb-4">{achievement.description}</p>
                <Badge className="bg-white bg-opacity-20 text-white font-bold">
                  {achievement.unlocked ? 'TERBUKA' : 'TERKUNCI'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Stats */}
        <div className="mt-12 bg-light-gray rounded-3xl p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-fredoka text-google-blue mb-2">
                {progress?.projectsCompleted || 0}
              </div>
              <p className="text-gray-600">Proyek Selesai</p>
            </div>
            <div>
              <div className="text-4xl font-fredoka text-success-green mb-2">
                {progress?.badges?.length || 0}
              </div>
              <p className="text-gray-600">Lencana Terkumpul</p>
            </div>
            <div>
              <div className="text-4xl font-fredoka text-orange mb-2">
                {Math.round((progress?.highestAccuracy || 0) * 100)}%
              </div>
              <p className="text-gray-600">Akurasi Tertinggi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
