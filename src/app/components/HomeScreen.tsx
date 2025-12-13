import { FileText, Plus, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ConnectivityBanner } from './ConnectivityBanner';


interface HomeScreenProps {
  isOnline: boolean;
  pendingCount: number;
  onCreateIncident: () => void;
  onViewReports: () => void;
  onLogout: () => void;
}

export function HomeScreen({
  isOnline,
  pendingCount,
  onCreateIncident,
  onViewReports,
  onLogout
}: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <ConnectivityBanner isOnline={isOnline} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2">Field Responder</h1>
            <p className="text-muted-foreground m-0">Emergency Response Dashboard</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <Button
              onClick={onCreateIncident}
              className="w-full h-auto py-6 gap-3"
              size="lg"
            >
              <Plus className="w-6 h-6" />
              <span>Create Incident Report</span>
            </Button>
          </Card>

          <Card className="p-6">
            <Button
              onClick={onViewReports}
              variant="outline"
              className="w-full h-auto py-6 gap-3 relative"
              size="lg"
            >
              <FileText className="w-6 h-6" />
              <span>Pending Reports</span>
              {pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-7 min-w-[1.75rem] rounded-full"
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </Card>
        </div>

        <Card className="p-4 bg-muted/30 border-muted">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <h4 className="mb-1">Offline-First Design</h4>
              <p className="text-sm text-muted-foreground m-0">
                All incident reports are saved locally first. When you're online,
                they will automatically sync to the server.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
