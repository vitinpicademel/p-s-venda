"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { ProcessLog } from "@/types/process-logs";
import { Clock, User, FileText, Settings, Trash2, Upload, CheckCircle, Plus } from "lucide-react";

interface ProcessHistoryProps {
  processId: string;
}

export default function ProcessHistory({ processId }: ProcessHistoryProps) {
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const supabase = createClient();
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("process_logs")
          .select("*")
          .eq("process_id", processId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [processId]);

  const getActionIcon = (action: ProcessLog["action"]) => {
    switch (action) {
      case "process_created":
        return <Plus className="h-4 w-4 text-blue-600" />;
      case "process_updated":
        return <Settings className="h-4 w-4 text-orange-600" />;
      case "step_toggled":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "document_uploaded":
        return <Upload className="h-4 w-4 text-purple-600" />;
      case "document_deleted":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "contract_uploaded":
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case "status_changed":
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-slate-500">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-slate-500">Nenhuma atividade registrada neste processo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#d4a574]" />
          Histórico de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50"
            >
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {log.description}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(log.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
