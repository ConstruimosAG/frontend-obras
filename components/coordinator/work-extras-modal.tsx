"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Work } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface WorkExtrasModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    work: Work;
    onSubmit: (data: {
        personnelRequired: Record<string, unknown>;
        extras: Record<string, unknown>;
    }) => Promise<void> | void;
    isSubmitting?: boolean;
}

export function WorkExtrasModal({
    open,
    onOpenChange,
    work,
    onSubmit,
    isSubmitting = false,
}: WorkExtrasModalProps) {
    const isReadOnly = work.finalized;

    const [formData, setFormData] = useState({
        oficiales: "",
        ayudantes: "",
        mediaCuchara: "",
        siso: "",
        otroPersonalName: "",
        otroPersonalQuantity: "",
        andamio: "",
        equiposDeAltura: "",
        volqueta: "",
        acarreoYTransporte: "",
        herramientaEspecial: "",
        otroExtrasName: "",
        otroExtrasQuantity: "",
        notes: "",
    });

    useEffect(() => {
        if (!open) return;

        const personnel = work.personnelRequired || {};
        const extras = work.extras || {};

        setFormData({
            oficiales: String(personnel.oficiales || ""),
            ayudantes: String(personnel.ayudantes || ""),
            mediaCuchara: String(personnel.mediaCuchara || ""),
            siso: String(personnel.siso || ""),
            otroPersonalName: String(personnel.otroName || ""),
            otroPersonalQuantity: String(personnel.otroQuantity || ""),
            andamio: String(extras.andamio || ""),
            equiposDeAltura: String(extras.equiposDeAltura || ""),
            volqueta: String(extras.volqueta || ""),
            acarreoYTransporte: String(extras.acarreoYTransporte || ""),
            herramientaEspecial: String(extras.herramientaEspecial || ""),
            otroExtrasName: String(extras.otroName || ""),
            otroExtrasQuantity: String(extras.otroQuantity || ""),
            notes: String(extras.notes || ""),
        });
    }, [work, open]);

    const buildPersonnelRequired = (): Record<string, unknown> => {
        const personnel: Record<string, unknown> = {};

        if (formData.oficiales) personnel.oficiales = Number(formData.oficiales);
        if (formData.ayudantes) personnel.ayudantes = Number(formData.ayudantes);
        if (formData.mediaCuchara) personnel.mediaCuchara = Number(formData.mediaCuchara);
        if (formData.siso) personnel.siso = Number(formData.siso);
        if (formData.otroPersonalName) {
            personnel.otroName = formData.otroPersonalName;
            if (formData.otroPersonalQuantity) {
                personnel.otroQuantity = Number(formData.otroPersonalQuantity);
            }
        }
        return personnel;
    };

    const buildExtras = (): Record<string, unknown> => {
        const extras: Record<string, unknown> = {};

        if (formData.andamio) extras.andamio = Number(formData.andamio);
        if (formData.equiposDeAltura) extras.equiposDeAltura = Number(formData.equiposDeAltura);
        if (formData.volqueta) extras.volqueta = Number(formData.volqueta);
        if (formData.acarreoYTransporte) extras.acarreoYTransporte = Number(formData.acarreoYTransporte);
        if (formData.herramientaEspecial) extras.herramientaEspecial = Number(formData.herramientaEspecial);
        if (formData.otroExtrasName) {
            extras.otroName = formData.otroExtrasName;
            if (formData.otroExtrasQuantity) {
                extras.otroQuantity = Number(formData.otroExtrasQuantity);
            }
        }
        if (formData.notes) extras.notes = formData.notes;

        return extras;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        await onSubmit({
            personnelRequired: buildPersonnelRequired(),
            extras: buildExtras(),
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        {isReadOnly ? "Adicionales (Solo Lectura)" : "Añadir Adicionales"}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {isReadOnly
                            ? "La obra está finalizada, no se pueden modificar los adicionales."
                            : "Ingresa el personal requerido y adicionales generales de la obra."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Requerido Section */}
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Personal Requerido
                        </Label>
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <p className="text-sm text-gray-500 mt-1">
                                    Ingresa la cantidad necesaria para cada tipo de personal
                                </p>
                            </div>

                            <div className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                {[
                                    { label: "OFICIALES", key: "oficiales" },
                                    { label: "AYUDANTES", key: "ayudantes" },
                                    { label: "MEDIA CUCHARA", key: "mediaCuchara" },
                                    { label: "SISO", key: "siso" },
                                ].map((tipo) => (
                                    <div
                                        key={tipo.key}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {tipo.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={formData[tipo.key as keyof typeof formData] as string}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        [tipo.key]: e.target.value,
                                                    })
                                                }
                                                className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                                disabled={isSubmitting || isReadOnly}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Opción "Otro" en Personal Requerido */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={formData.otroPersonalName}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    otroPersonalName: e.target.value,
                                                })
                                            }
                                            placeholder="Otro (describir)"
                                            className="w-full bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                            disabled={isSubmitting || isReadOnly}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={formData.otroPersonalQuantity}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    otroPersonalQuantity: e.target.value,
                                                })
                                            }
                                            className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                            disabled={isSubmitting || isReadOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Adicionales Section */}
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Adicionales
                        </Label>
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <p className="text-sm text-gray-500 mt-1">
                                    Ingresa la cantidad necesaria para cada tipo de adicional
                                </p>
                            </div>

                            <div className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                {[
                                    { label: "ANDAMIO", key: "andamio" },
                                    { label: "EQUIPOS DE ALTURA", key: "equiposDeAltura" },
                                    { label: "VOLQUETA", key: "volqueta" },
                                    { label: "ACARREO Y TRANSPORTE", key: "acarreoYTransporte" },
                                    { label: "HERRAMIENTA ESPECIAL", key: "herramientaEspecial" },
                                ].map((tipo) => (
                                    <div
                                        key={tipo.key}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {tipo.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={formData[tipo.key as keyof typeof formData] as string}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        [tipo.key]: e.target.value,
                                                    })
                                                }
                                                className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                                disabled={isSubmitting || isReadOnly}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Opción "Otro" en Adicionales */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={formData.otroExtrasName}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    otroExtrasName: e.target.value,
                                                })
                                            }
                                            placeholder="Otro (describir)"
                                            className="w-full bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                            disabled={isSubmitting || isReadOnly}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={formData.otroExtrasQuantity}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    otroExtrasQuantity: e.target.value,
                                                })
                                            }
                                            className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                            disabled={isSubmitting || isReadOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notas Adicionales */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas Adicionales</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            placeholder="Información adicional sobre la obra..."
                            rows={2}
                            disabled={isSubmitting || isReadOnly}
                            className="dark:text-white"
                        />
                    </div>

                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto"
                        >
                            {isReadOnly ? "Cerrar" : "Cancelar"}
                        </Button>
                        {!isReadOnly && (
                            <Button
                                type="submit"
                                className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                                Guardar
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
