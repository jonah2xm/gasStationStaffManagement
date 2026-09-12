"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Calendar as CalendarIcon,
    Clock,
    Loader2,
    Edit2
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, EmployeeIdentity, Field, FormActions, FormSection, FormSkeleton } from "@/components/ui/form-layout";

export default function EditPointagePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [pointage, setPointage] = useState(null);

    const [formData, setFormData] = useState({
        date: "",
        entryTime: "",
        exitTime: "",
    });

    useEffect(() => {
        if (id) fetchPointage();
    }, [id]);

    const fetchPointage = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pointage/${id}`, {
                credentials: "include",
            });
            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Pointage non trouvé");
                    router.push("/pointage-list");
                    return;
                }
                throw new Error("Failed to fetch");
            }
            const item = await response.json();
            setPointage(item);

            // Format date and times for inputs
            const dateStr = new Date(item.date).toISOString().split("T")[0];
            const entryStr = item.entryTime ? new Date(item.entryTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
            const exitStr = item.exitTime ? new Date(item.exitTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";

            setFormData({
                date: dateStr,
                entryTime: entryStr,
                exitTime: exitStr,
            });
        } catch (error) {
            toast.error("Erreur lors du chargement des données");
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const entryDateTime = formData.entryTime ? new Date(`${formData.date}T${formData.entryTime}`) : null;
            const exitDateTime = formData.exitTime ? new Date(`${formData.date}T${formData.exitTime}`) : null;

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pointage/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: formData.date,
                    entryTime: entryDateTime ? entryDateTime.toISOString() : null,
                    exitTime: exitDateTime ? exitDateTime.toISOString() : null,
                }),
                credentials: "include",
            });

            if (!response.ok) throw new Error("Erreur lors de la mise à jour");

            toast.success("Pointage mis à jour");
            router.push("/pointage-list");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <FormSkeleton />;
    }

    // "07:58" → "16:12" gives "8 h 14"; empty until both times are set and the exit is later.
    const workedTime = (() => {
        if (!formData.entryTime || !formData.exitTime) return "";
        const [entryHours, entryMinutes] = formData.entryTime.split(":").map(Number);
        const [exitHours, exitMinutes] = formData.exitTime.split(":").map(Number);
        const minutes = exitHours * 60 + exitMinutes - (entryHours * 60 + entryMinutes);
        if (minutes <= 0) return "";
        return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
    })();

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
            <PageHeader
                backHref="/pointage-list"
                backLabel="Pointages"
                title="Modifier le pointage"
                description={pointage ? `${pointage.firstName} ${pointage.lastName} · ${pointage.matricule}` : undefined}
            />

            <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
                <FormSection title="Employé" description="L'agent et sa station ne peuvent pas être modifiés.">
                    <Field label="Employé" full>
                        <div className="flex min-h-11 items-center rounded-md border border-dashed border-input bg-background px-2.5 py-1.5">
                            <EmployeeIdentity
                                firstName={pointage?.firstName}
                                lastName={pointage?.lastName}
                                matricule={pointage?.matricule}
                                meta={pointage?.stationName}
                                size="sm"
                                highlighted
                            />
                        </div>
                    </Field>
                </FormSection>

                <FormSection title="Horaires" description="Corrigez la date ou les heures d'entrée et de sortie.">
                    <Field label="Date" htmlFor="date" required>
                        <Input
                            type="date"
                            id="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            disabled={loading}
                            className="tabular-nums"
                        />
                    </Field>
                    <Field label="Heure d'entrée" htmlFor="entryTime" required>
                        <Input
                            type="time"
                            id="entryTime"
                            value={formData.entryTime}
                            onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                            required
                            disabled={loading}
                            className="tabular-nums"
                        />
                    </Field>
                    <Field label="Heure de sortie" htmlFor="exitTime" hint="Laissez vide si l'agent n'a pas encore pointé sa sortie.">
                        <Input
                            type="time"
                            id="exitTime"
                            value={formData.exitTime}
                            onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                            disabled={loading}
                            className="tabular-nums"
                        />
                    </Field>
                    <Field label="Temps de présence">
                        <ComputedValue icon={Clock} placeholder="Entrée et sortie requises">
                            {workedTime}
                        </ComputedValue>
                    </Field>
                </FormSection>

                <FormActions>
                    <Button asChild variant="outline">
                        <Link href="/pointage-list">Annuler</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Mise à jour…
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Enregistrer les modifications
                            </>
                        )}
                    </Button>
                </FormActions>
            </form>

            <Toaster position="bottom-right" />
        </div>
    );
}
