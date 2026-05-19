import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import { Shield, Check, AlertTriangle } from 'lucide-react';

interface Props {
  baaConfirmed: boolean;
}

export default function Settings({ baaConfirmed: initialBaa }: Props) {
  const [baa, setBaa] = useState(initialBaa);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Write BAA confirmation to a cookie via API
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baaConfirmed: baa }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Settings — phi-scribe">
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">Settings</h1>

        {/* BAA Section */}
        <section className="border border-border rounded-lg p-4 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-semibold">BAA Confirmation (Cloud Models)</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Cloud LLMs (OpenAI, Anthropic) are blocked by default. To enable them, you must confirm that you have a
                signed Business Associate Agreement (BAA) with the relevant provider AND that sending patient encounter
                data to that provider is permitted under your organization&apos;s compliance posture.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800">
              <strong>Important:</strong> phi-scribe does not enforce HIPAA compliance on your behalf. By enabling cloud
              models, you are taking responsibility for ensuring your use complies with all applicable regulations and
              your BAA terms. When in doubt, use a local model — your data never leaves your machine.
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={baa}
              onChange={(e) => setBaa(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm">
              I confirm I have a signed BAA with any cloud provider I intend to use, and I accept responsibility for
              compliance.
            </span>
          </label>
        </section>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors self-start"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return {
    props: {
      baaConfirmed: ctx.req.cookies['phi-scribe-baa'] === 'true',
    },
  };
};
