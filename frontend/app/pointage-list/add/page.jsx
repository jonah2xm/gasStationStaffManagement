"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Calendar as CalendarIcon,
    Clock,
    Loader2
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, Field, FormActions, FormSection } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";

export default function AddPointagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
    const [personnelList, setPersonnelList] = useState([]);

    const [formData, setFormData] = useState({
        matricule: "",
        date: new Date().toISOString().split("T")[0],
        entryTime: "",
        exitTime: "",
    });

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setPersonnelList(data);
        } catch (error) {
            toast.error("Erreur lors du chargement de la liste du personnel");
        } finally {
            setFetchingPersonnel(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.matricule || !formData.date || !formData.entryTime) {
            toast.error("Veuillez remplir au moins le matricule, la date et l'heure d'entrée");
            return;
        }

        setLoading(true);
        try {
            // Combine date and time for entry/exit
            const entryDateTime = new Date(`${formData.date}T${formData.entryTime}`);
            const exitDateTime = formData.exitTime ? new Date(`${formData.date}T${formData.exitTime}`) : null;

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pointage/manual`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matricule: formData.matricule,
                    date: formData.date,
                    entryTime: entryDateTime.toISOString(),
                    exitTime: exitDateTime ? exitDateTime.toISOString() : null,
                }),
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Erreur lors de la création");
            }

            toast.success("Pointage ajouté avec succès");
            router.push("/pointage-list");
            router.refresh();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const [pickerOpen, setPickerOpen] = useState(false);
    const selectedPerson = personnelList.find((p) => p.matricule === formData.matricule) || null;

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
                title="Nouveau pointage manuel"
                description="Enregistrez une présence lorsque l'agent n'a pas pu pointer lui-même."
            />

            <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
                <FormSection title="Employé" description="Seuls les agents disposant d'un compte personnel apparaissent.">
                    <Field label="Employé" htmlFor="matricule" required full>
                        <EmployeeCombobox
                            id="matricule"
                            open={pickerOpen}
                            onOpenChange={setPickerOpen}
                            people={personnelList}
                            selected={selectedPerson}
                            onSelect={(person) => {
                                setFormData({ ...formData, matricule: person.matricule });
                                setPickerOpen(false);
                            }}
                            loading={fetchingPersonnel}
                            disabled={loading}
                        />
                    </Field>
                </FormSection>

                <FormSection title="Horaires" description="L'heure de sortie peut être ajoutée plus tard.">
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
                    <Field label="Heure de sortie" htmlFor="exitTime" hint="Optionnel.">
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
                                Enregistrement…
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Enregistrer le pointage
                            </>
                        )}
                    </Button>
                </FormActions>
            </form>

            <Toaster position="bottom-right" />
        </div>
    );
}
