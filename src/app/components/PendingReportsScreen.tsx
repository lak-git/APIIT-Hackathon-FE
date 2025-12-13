import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ConnectivityBanner } from './ConnectivityBanner';
import type { IncidentReport } from '../utils/storage';

interface PendingReportsScreenProps {
  isOnline: boolean;
  reports: IncidentReport[];
  onBack: () => void;
  onSync: () => void;
  onRetry: (id: string) => void;
}

const STATUS_CONFIG = {
  local: {
    label: 'Saved Locally',
    color: 'bg-gray-500',
    icon: Clock,
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    icon: Clock,
  },
  syncing: {
    label: 'Syncing',
    color: 'bg-blue-500',
    icon: Loader2,
  },
  synced: {
    label: 'Synced',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500',
    icon: AlertCircle,
  },
} as const;

const SEVERITY_COLORS = {
  1: 'bg-blue-100 text-blue-800 border-blue-300',
  2: 'bg-green-100 text-green-800 border-green-300',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  4: 'bg-orange-100 text-orange-800 border-orange-300',
  5: 'bg-red-100 text-red-800 border-red-300',
} as const;

export function PendingReportsScreen({ 
  isOnline, 
  reports, 
  onBack, 
  onSync,
  onRetry 
}: PendingReportsScreenProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <ConnectivityBanner isOnline={isOnline} />
      
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="m-0 flex-1">Pending Reports</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={onSync}
            disabled={!isOnline}
            title={isOnline ? 'Sync now' : 'Offline - sync unavailable'}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {reports.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1">No Reports Yet</h3>
              <p className="text-muted-foreground m-0">
                Create your first incident report to get started
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusConfig = STATUS_CONFIG[report.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={report.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="mb-1">{report.type}</h4>
                        <p className="text-sm text-muted-foreground m-0">
                          {new Date(report.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge 
                        className={`${SEVERITY_COLORS[report.severity]} border`}
                      >
                        Severity {report.severity}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                        <StatusIcon 
                          className={`w-4 h-4 ${
                            report.status === 'syncing' ? 'animate-spin' : ''
                          }`}
                        />
                        <span className="text-sm">{statusConfig.label}</span>
                      </div>

                      {report.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(report.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground m-0">
                        Location: {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                      </p>
                    </div>

                    {report.photo && (
                      <img
                        src={report.photo}
                        alt="Incident"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
