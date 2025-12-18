import { useState, useEffect } from "react";
import { teamsApi } from "../api/teams";

export default function Admin() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await teamsApi.getConfig();
      setWebhookUrl(config.webhook_url || "");
    } catch (error) {
      console.error("Failed to load config:", error);
      setMessage({ type: "error", text: "Failed to load configuration" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await teamsApi.updateConfig(webhookUrl, "admin");
      setMessage({ type: "success", text: "Configuration saved successfully" });
    } catch (error) {
      console.error("Failed to save config:", error);
      setMessage({ type: "error", text: "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      await teamsApi.testWebhook();
      setMessage({ type: "success", text: "Test notification sent successfully" });
    } catch (error) {
      console.error("Failed to test webhook:", error);
      setMessage({ type: "error", text: "Failed to send test notification" });
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">Admin - Teams Configuration</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Teams Webhook URL</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://outlook.office.com/webhook/..."
            className="w-full px-4 py-2 border rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter the Teams incoming webhook URL for delivery notifications
          </p>
        </div>
        {message && (
          <div
            className={`p-3 rounded ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          <button
            onClick={handleTest}
            disabled={!webhookUrl}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Test Webhook
          </button>
        </div>
      </div>
    </div>
  );
}
