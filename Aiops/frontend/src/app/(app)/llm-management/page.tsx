'use client';

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LlmConfig = {
  id: string;
  model: string;
  apiKey: string;
  notes?: string;
  createdAt: string;
};

const AVAILABLE_LLMS = [
  "OpenAI - gpt-4o",
  "OpenAI - gpt-4",
  "Anthropic - Claude 3",
  "Cohere - Command",
  "Local / Llama",
  "Custom (URL)",
];

export default function LlmManagementPage() {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saved, setSaved] = useState<LlmConfig[]>([]);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const STORAGE_KEY = "llmConfigs";

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LlmConfig[];
        setSaved(parsed);
      } catch {
        setSaved([]);
      }
    }
  }, []);

  useEffect(() => {
    // keep fields synced when selecting an existing saved model for quick edit
    if (!selectedModel && !editingId) {
      setApiKey("");
      setNotes("");
    }
  }, [selectedModel, editingId]);

  function persist(list: LlmConfig[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setSaved(list);
  }

  function resetForm() {
    setSelectedModel("");
    setApiKey("");
    setNotes("");
    setEditingId(null);
    setShowApiKey(false);
  }

  function handleSave() {
    if (!selectedModel) {
      alert("Please select a model first.");
      return;
    }
    if (!apiKey.trim()) {
      alert("Please enter the API key.");
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      // update existing
      const updated = saved.map((s) =>
        s.id === editingId ? { ...s, model: selectedModel, apiKey: apiKey.trim(), notes, createdAt: now } : s
      );
      persist(updated);
      resetForm();
      return;
    }

    const newEntry: LlmConfig = {
      id: `${selectedModel.replace(/\s+/g, "_")}_${Date.now()}`,
      model: selectedModel,
      apiKey: apiKey.trim(),
      notes,
      createdAt: now,
    };

    persist([newEntry, ...saved]);
    resetForm();
  }

  function handleEdit(entry: LlmConfig) {
    setEditingId(entry.id);
    setSelectedModel(entry.model);
    setApiKey(entry.apiKey);
    setNotes(entry.notes || "");
    setShowApiKey(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this LLM configuration?")) return;
    const filtered = saved.filter((s) => s.id !== id);
    persist(filtered);
    if (editingId === id) resetForm();
  }

  function handleCopyKey(key: string) {
    navigator.clipboard?.writeText(key).then(
      () => alert("API key copied to clipboard"),
      () => alert("Unable to copy")
    );
  }

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator"]}>
        <section className="space-y-6">

          <Card className="border border-white/10 bg-white/5 p-6 text-white/70">
            <p className="font-semibold text-white">Workspace</p>
            <p className="mt-2 text-sm">
              Select an LLM from the list, enter its API key and optional notes, then save the configuration.
            </p>

            {/* form */}
            <div className="mt-6 space-y-4">
              <label className="block">
                <div className="text-sm mb-1">Choose model</div>
                <select
                  className="w-full rounded bg-white/5 px-3 py-2 text-white/90 outline-none"
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    // when choosing a model, clear edit state if selecting a different one
                    if (editingId && saved.find((s) => s.id === editingId)?.model !== e.target.value) {
                      setEditingId(null);
                      setApiKey("");
                      setNotes("");
                    }
                  }}
                >
                  <option value="">— Select a model —</option>
                  {AVAILABLE_LLMS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              {/* show API Key + notes only when model selected */}
              {selectedModel && (
                <>
                  <label className="block">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Enter API key</span>
                      <span className="text-xs text-white/50">for {selectedModel}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? "text" : "password"}
                        className="flex-1 rounded bg-white/5 px-3 py-2 text-white/90 outline-none"
                        placeholder="sk-•••••• or paste key here"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        aria-label="Enter API key"
                      />
                      <Button variant="outline" onClick={() => setShowApiKey((s) => !s)}>
                        {showApiKey ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-sm mb-1">Notes</div>
                    <textarea
                      className="w-full rounded bg-white/5 px-3 py-2 text-white/90 outline-none"
                      placeholder="Optional notes (usage, project, special instructions...)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={!apiKey.trim()}>
                      {editingId ? "Save changes" : "Save"}
                    </Button>
                    <Button variant="muted" onClick={resetForm}>
                      Cancel
                    </Button>
                    <span className="text-sm text-white/50">
                      {editingId ? "Editing saved config" : ""}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* saved list */}
          <div className="space-y-3">
            <p className="text-sm text-white/60">Saved LLM configurations</p>
            {saved.length === 0 ? (
              <Card className="border border-white/6 bg-white/3 p-4 text-white/70">No saved configurations yet.</Card>
            ) : (
              saved.map((s) => (
                <Card key={s.id} className="border border-white/6 bg-white/3 p-4 text-white/70 flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-white">{s.model}</div>
                      <div className="text-xs text-white/50">Saved: {new Date(s.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 text-sm text-white/60 line-clamp-3">{s.notes || <span className="text-white/40">— no notes —</span>}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCopyKey(s.apiKey)}>Copy key</Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(s)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>Delete</Button>
                    </div>
                    <div className="text-xs text-white/50 mt-1">id: {s.id}</div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </RequireRole>
    </AuthGate>
  );
}
