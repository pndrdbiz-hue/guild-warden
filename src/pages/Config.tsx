import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase, type BotConfig } from "@/lib/supabase";
import { Save, Loader2 } from "lucide-react";

export default function Config() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BotConfig>({
    guild_id: "default",
    verify_channel_id: "",
    verifier_role_id: "",
    student_role_id: "",
  });

  // Mock data - replace with actual Discord API calls or cached data
  const channels = [
    { id: "123456789", name: "verification" },
    { id: "987654321", name: "welcome" },
    { id: "555666777", name: "general" },
  ];

  const roles = [
    { id: "role_1", name: "Verifier" },
    { id: "role_2", name: "Student" },
    { id: "role_3", name: "Admin" },
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bot_config")
        .select("*")
        .eq("guild_id", "default")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_config")
        .upsert({
          ...config,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bot Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure Discord channels and roles for the verification bot
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Verification Settings</CardTitle>
          <CardDescription>
            Select the channels and roles that the bot should use
            {config.updated_at && (
              <span className="block mt-2 text-xs">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="verify-channel">Verification Channel</Label>
            <Select
              value={config.verify_channel_id}
              onValueChange={(value) =>
                setConfig({ ...config, verify_channel_id: value })
              }
            >
              <SelectTrigger id="verify-channel">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    #{channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Channel where verification messages will be sent
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verifier-role">Verifier Role</Label>
            <Select
              value={config.verifier_role_id}
              onValueChange={(value) =>
                setConfig({ ...config, verifier_role_id: value })
              }
            >
              <SelectTrigger id="verifier-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    @{role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Role that can approve/reject verifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-role">Student Role</Label>
            <Select
              value={config.student_role_id}
              onValueChange={(value) =>
                setConfig({ ...config, student_role_id: value })
              }
            >
              <SelectTrigger id="student-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    @{role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Role assigned to verified students
            </p>
          </div>

          <Button
            onClick={saveConfig}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
