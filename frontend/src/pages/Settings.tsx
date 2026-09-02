import { DashboardLayout } from '../components/DashboardLayout';
import { Code, Globe, Zap } from 'lucide-react';
import { Button } from '../components/BulkActions';
import { useState } from 'react';

export function Settings() {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="http://localhost:8000/cdn/loc.js"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your localization setup</p>
        </div>

        {/* Publishing Snippet */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Code className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Publishing Snippet</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Add this snippet to your website's HTML to enable runtime localization.
                The script will automatically inject a language switcher widget.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                  {snippet}
                </code>
                <Button onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Multi-Language</h3>
            <p className="text-sm text-gray-500 mt-1">
              Support for 6+ languages with human-readable names
            </p>
          </div>
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Translation Memory</h3>
            <p className="text-sm text-gray-500 mt-1">
              Reuse existing translations with SHA256 hashing
            </p>
          </div>
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <Code className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Zero Dependencies</h3>
            <p className="text-sm text-gray-500 mt-1">
              Pure vanilla JavaScript, no frameworks required
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}