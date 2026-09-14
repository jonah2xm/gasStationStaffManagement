"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { estGestion } from "@/lib/suivi";
import { useCurrentUser } from "@/lib/use-current-user";
import { SuiviDocuments } from "@/components/suivi/suivi-documents";
import { useSuivi } from "@/components/suivi/use-suivi";

const decoder = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
};

/** Documents d'une station, pour le gestionnaire et l'administrateur. */
export default function SuiviStationPage() {
  const params = useParams();
  const router = useRouter();
  const station = decoder(params?.station);
  const user = useCurrentUser();
  const gestion = Boolean(user && estGestion(user.role));

  // Le chef de station n'a qu'une station : sa vue est la page Suivi elle-même.
  useEffect(() => {
    if (user && !estGestion(user.role)) router.replace("/suivi");
  }, [user, router]);

  const { donnees, loading, erreur, recharger } = useSuivi({ station, pret: gestion });

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 text-foreground lg:p-8">
      <PageHeader
        backHref="/suivi"
        backLabel="Toutes les stations"
        title={station}
        description="Suivi des documents de la station : réception des bordereaux et transmission au District CBR."
        actions={
          donnees && (
            <Button variant="outline" onClick={() => recharger()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          )
        }
      />

      {!gestion || (loading && !donnees) ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="p-0">
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : erreur && !donnees ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive-text" />
            <p className="text-[13.5px] text-muted-foreground">{erreur.message}</p>
            <Button variant="outline" onClick={() => recharger()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SuiviDocuments donnees={donnees} gestion recharger={recharger} />
      )}

      <Toaster position="bottom-left" />
    </div>
  );
}
