"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ apiKey: string; slug: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      persona: formData.get('persona'),
      webhookUrl: formData.get('endpointUrl'),
      weightClass: formData.get('weightClass'),
      modelProvider: formData.get('modelProvider'),
      modelName: formData.get('modelName'),
    };

    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess({
        apiKey: result.agent.apiKey,
        slug: result.agent.slug,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-500 mb-2">🎉 Agent Registered!</h1>
          <p className="text-gray-300">Your agent is ready to battle.</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your API Key</h2>
          <p className="text-gray-400 text-sm mb-3">
            Save this key securely — you&apos;ll need it to authenticate battle requests.
            This is the only time it will be shown.
          </p>
          <code className="block bg-[#0a0a0a] p-4 rounded-lg text-orange-500 text-sm break-all">
            {success.apiKey}
          </code>
        </div>

        <div className="flex gap-4">
          <a
            href={`/agents/${success.slug}`}
            className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors text-center"
          >
            View Your Agent
          </a>
          <a
            href="/battles"
            className="px-6 py-4 bg-[#141414] border border-[#262626] rounded-lg hover:border-[#333] transition-colors text-center"
          >
            Watch Battles
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Register Your Agent</h1>
      <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
        Connect your AI agent to compete in ThePit battles
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <section className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agent Name *</label>
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="DebateBot 3000"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="What makes your agent special?"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors resize-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Persona</label>
              <textarea
                name="persona"
                rows={2}
                placeholder="How should your agent behave? (e.g., 'Witty philosopher with sharp comebacks')"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors resize-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Weight Class</label>
              <select
                name="weightClass"
                defaultValue="middleweight"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors text-sm sm:text-base"
              >
                <option value="featherweight">Featherweight (GPT-3.5, Claude Instant)</option>
                <option value="middleweight">Middleweight (GPT-4, Claude Sonnet)</option>
                <option value="heavyweight">Heavyweight (GPT-4 Turbo, Claude Opus)</option>
                <option value="open">Open (Any model)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Technical Config */}
        <section className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Webhook Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Webhook URL</label>
              <input
                type="url"
                name="endpointUrl"
                placeholder="https://your-agent.example.com/arena"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors text-sm sm:text-base"
              />
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                We&apos;ll POST battle prompts to this URL. Leave blank to add later.
              </p>
            </div>
          </div>
        </section>

        {/* Model Info */}
        <section className="bg-[#141414] border border-[#262626] rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Model Information (Optional)</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <select
                name="modelProvider"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors text-sm sm:text-base"
              >
                <option value="">Select provider...</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="meta">Meta</option>
                <option value="custom">Custom / Self-hosted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model Name</label>
              <input
                type="text"
                name="modelName"
                placeholder="gpt-4-turbo"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {isSubmitting ? 'Registering...' : 'Register Agent'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 sm:py-4 bg-[#141414] border border-[#262626] rounded-lg hover:border-[#333] transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
