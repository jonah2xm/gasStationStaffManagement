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
import toast, { Toaster } from "react-hot-toast";

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

    return (
        <div className="container mx-auto p-6 max-w-2xl bg-gray-50 min-h-screen">
            <div className="mb-6">
                <Link href="/pointage-list" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors">
                    <ArrowLeft size={18} /> Retour à l'historique
                </Link>
            </div>

            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-600 text-white p-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Plus className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Nouveau Pointage Manuel</CardTitle>
                            <p className="text-blue-100 text-sm mt-1">Enregistrer une présence manuellement</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <UserIcon size={16} className="text-blue-500" /> Personnel
                                </label>
                                {fetchingPersonnel ? (
                                    <div className="h-12 flex items-center px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                                        <span className="text-sm text-gray-400">Chargement...</span>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-gray-800 font-medium"
                                        value={formData.matricule}
                                        onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                                        required
                                    >
                                        <option value="">Sélectionner un employé</option>
                                        {personnelList.map((p) => (
                                            <option key={p._id} value={p.matricule}>
                                                {p.matricule} - {p.lastName.toUpperCase()} {p.firstName} ({p.stationName})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider pl-1">Liste des comptes personnel actifs</p>
                            </div>

                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-blue-500" /> Date
                                </label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500 font-medium"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Clock size={16} className="text-green-500" /> Heure d'entrée
                                </label>
                                <Input
                                    type="time"
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500 font-medium"
                                    value={formData.entryTime}
                                    onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Clock size={16} className="text-orange-500" /> Heure de sortie
                                </label>
                                <Input
                                    type="time"
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500 font-medium"
                                    value={formData.exitTime}
                                    onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider pl-1">(Optionnel)</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex gap-4">
                            <Link href="/pointage-list" className="flex-1">
                                <Button type="button" variant="outline" className="w-full h-14 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all border-gray-200">
                                    Annuler
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                    <>
                                        <Save size={20} />
                                        Enregistrer le pointage
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <Toaster position="bottom-right" />
        </div>
    );
}

// Helper icons that were missing
function Plus(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
