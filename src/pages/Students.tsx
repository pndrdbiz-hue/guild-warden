import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase, type Student } from "@/lib/supabase";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (discordId: string, approve: boolean, hNumber: string) => {
    setActioningId(discordId);
    try {
      const timestamp = new Date().toISOString();
      const action = approve ? "Approved" : "Rejected";
      
      // Update student
      const { error: updateError } = await supabase
        .from("students")
        .update({
          verified: approve,
          verified_at: timestamp,
          verified_by: "admin", // Replace with actual admin ID from auth
          notes: approve ? "Approved via dashboard" : `Rejected by Admin at ${new Date().toLocaleString()}`,
        })
        .eq("discord_id", discordId);

      if (updateError) throw updateError;

      // Log the action
      const { error: logError } = await supabase
        .from("audit_logs")
        .insert({
          action: action,
          student_id: discordId,
          h_number: hNumber,
          performed_by: "admin", // Replace with actual admin email/id
          performed_at: timestamp,
        });

      if (logError) console.error("Error logging action:", logError);

      toast({
        title: `Student ${action}`,
        description: `Successfully ${action.toLowerCase()} the student`,
      });

      loadStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "Failed to update student status",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    if (filter === "all") return true;
    if (filter === "verified") return student.verified === true;
    if (filter === "rejected") return student.verified === false && student.notes?.includes("Rejected");
    if (filter === "pending") {
      return !student.verified && !student.notes?.includes("Rejected");
    }
    return true;
  });

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Verifications</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage student verification requests
          </p>
        </div>
        <Button onClick={loadStudents} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All ({students.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({students.filter(s => !s.verified && !s.notes?.includes("Rejected")).length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({students.filter(s => s.verified).length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({students.filter(s => s.verified === false && s.notes?.includes("Rejected")).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discord ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>H-Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const isRejected = student.verified === false && student.notes?.includes("Rejected");
                    const isPending = !student.verified && !isRejected;
                    
                    return (
                      <TableRow key={student.discord_id}>
                        <TableCell className="font-mono text-sm">
                          {student.discord_id}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell className="font-semibold">{student.h_number}</TableCell>
                        <TableCell>
                          {student.verified ? (
                            <Badge className="bg-green-500">Verified</Badge>
                          ) : isRejected ? (
                            <Badge variant="destructive">Rejected</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(student.submitted_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(student.verified_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.verified_by || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {student.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(student.discord_id, true, student.h_number)}
                              disabled={
                                student.verified || actioningId === student.discord_id
                              }
                            >
                              {actioningId === student.discord_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(student.discord_id, false, student.h_number)}
                              disabled={actioningId === student.discord_id}
                            >
                              {actioningId === student.discord_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
