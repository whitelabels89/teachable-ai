import MascotWelcome from "@/components/mascot-welcome";
import ModeSelector from "@/components/mode-selector";
import ProjectTemplates from "@/components/project-templates";
import AchievementSystem from "@/components/achievement-system";

export default function Home() {
  return (
    <div className="min-h-screen">
      <MascotWelcome />
      <ModeSelector />
      <ProjectTemplates />
      <AchievementSystem />
    </div>
  );
}
