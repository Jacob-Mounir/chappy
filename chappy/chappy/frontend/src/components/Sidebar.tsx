import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function Sidebar() {
  const {
    channels,
    currentChannel,
    setCurrentChannel,
    fetchChannels,
    user
  } = useStore();

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user, fetchChannels]);

  return (
    <div className="w-64 bg-background border-r border-border h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Chappy</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Kanaler</h2>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {channels?.map((channel) => (
            <Button
              key={channel._id}
              variant={currentChannel?._id === channel._id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentChannel(channel)}
            >
              # {channel.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}