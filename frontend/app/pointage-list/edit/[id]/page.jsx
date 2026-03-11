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
import toast, { Toaster } from "react-hot-toast";

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
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl bg-gray-50 min-h-screen">
            <div className="mb-6">
                <Link href="/pointage-list" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium">
                    <ArrowLeft size={18} /> Retour à l'historique
                </Link>
            </div>

            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-600 text-white p-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Edit2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Modifier le Pointage</CardTitle>
                            <p className="text-blue-100 text-sm mt-1">
                                Personnel: <span className="font-bold text-white uppercase">{pointage?.lastName} {pointage?.firstName}</span>
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <UserIcon size={14} className="text-blue-500" /> Informations complètes
                                </label>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Matricule</p>
                                        <p className="font-mono text-blue-600 font-bold">{pointage?.matricule}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Station</p>
                                        <p className="text-gray-700 font-bold">{pointage?.stationName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-blue-500" /> Date
                                </label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500"
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
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500"
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
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500"
                                    value={formData.exitTime}
                                    onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex gap-4">
                            <Link href="/pointage-list" className="flex-1">
                                <Button type="button" variant="outline" className="w-full h-14 rounded-2xl text-gray-500 font-bold border-gray-200">
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
                                        Mettre à jour
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
