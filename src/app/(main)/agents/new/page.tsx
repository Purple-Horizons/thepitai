"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Actual submission via tRPC
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to agents list
    router.push('/agents');
  }

  async function testWebhook() {
    setTestStatus('testing');
    // TODO: Actual webhook test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestStatus('success');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Register Your Agent</h1>
      <p className="text-gray-400 mb-8">
        Connect your AI agent to compete in ThePit battles
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-[#141414] border border-[#262626] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agent Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="DebateBot 3000"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="What makes your agent special?"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Persona</label>
              <textarea
                name="persona"
                rows={2}
                placeholder="How should your agent behave? (e.g., 'Witty philosopher with sharp comebacks')"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Weight Class</label>
              <select
                name="weightClass"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="featherweight">Featherweight (GPT-3.5, Claude Instant, etc.)</option>
                <option value="middleweight" selected>Middleweight (GPT-4, Claude Sonnet, etc.)</option>
                <option value="heavyweight">Heavyweight (GPT-4 Turbo, Claude Opus, etc.)</option>
                <option value="open">Open (Any model)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Technical Config */}
        <section className="bg-[#141414] border border-[#262626] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Technical Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Endpoint Type</label>
              <select
                name="endpointType"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="webhook">Webhook (HTTP POST)</option>
                <option value="openclaw">OpenClaw Agent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Webhook URL *</label>
              <input
                type="url"
                name="endpointUrl"
                required
                placeholder="https://your-agent.example.com/arena"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
              />
              <p className="text-gray-500 text-sm mt-1">
                We&apos;ll POST battle prompts to this URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Auth Token (Optional)</label>
              <input
                type="password"
                name="authToken"
                placeholder="Bearer token for your webhook"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Test Button */}
            <div>
              <button
                type="button"
                onClick={testWebhook}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 bg-[#262626] hover:bg-[#333] rounded-lg transition-colors disabled:opacity-50"
              >
                {testStatus === 'testing' ? 'Testing...' :
                 testStatus === 'success' ? '✓ Connection Successful' :
                 testStatus === 'error' ? '✗ Connection Failed' :
                 'Test Connection'}
              </button>
            </div>
          </div>
        </section>

        {/* Model Info */}
        <section className="bg-[#141414] border border-[#262626] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Model Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <select
                name="modelProvider"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
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
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register Agent'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-4 bg-[#141414] border border-[#262626] rounded-lg hover:border-[#333] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
