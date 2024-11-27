import { useStore } from "../store/useStore";
import { Sidebar } from "./Sidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function MainLayout() {
  const { currentChannel, user } = useStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-card rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Welcome to Chappy</h1>
          <p className="text-muted-foreground mb-4">Please log in to continue.</p>
          <button
            onClick={() => useStore.getState().setUser({ _id: "1", username: "test", email: "test@test.com" })}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {currentChannel && <MessageList />}
          {!currentChannel && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a channel to start chatting
            </div>
          )}
        </div>
        {currentChannel && <MessageInput />}
      </main>
    </div>
  );
}