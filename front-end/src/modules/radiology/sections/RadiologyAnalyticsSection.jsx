import { useRadiologyStore } from '../store/radiologyStore';
import { Card, CardContent } from '../../laboratory/components/ui/card';

export function RadiologyAnalyticsSection() {
  const { analytics } = useRadiologyStore();
  const stats = analytics || { statusCounts: {}, commonModalities: [], volumeByDay: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Imaging Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">Status breakdown</h3>
            <ul className="space-y-2">
              {Object.entries(stats.statusCounts || {}).map(([k, v]) => (
                <li key={k} className="flex justify-between text-sm">
                  <span>{k}</span>
                  <span className="font-bold">{v}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">Modality volume</h3>
            <ul className="space-y-2">
              {(stats.commonModalities || []).map(({ name, count }) => (
                <li key={name} className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-bold">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
