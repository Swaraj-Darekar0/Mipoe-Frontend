import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { fetchCreatorCampaigns, Campaign, SubmittedClipData, AcceptedClipData, deleteClip } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Link as LinkIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


type Clip = (SubmittedClipData | AcceptedClipData) & { campaignName: string };

const getClipStatusInfo = (clip: Clip) => {
  if ('media_id' in clip && clip.media_id) {
    return { label: "Accepted", color: "bg-green-600/20 text-green-300", icon: <CheckCircle className="w-3 h-3" /> };
  } else if ('is_deleted_by_admin' in clip && clip.is_deleted_by_admin) {
    return { label: "Rejected", color: "bg-red-600/20 text-red-300", icon: <XCircle className="w-3 h-3" /> };
  } else {
    return { label: "In Review", color: "bg-yellow-600/20 text-yellow-300", icon: <Clock className="w-3 h-3" /> };
  }
};

const SubmissionsPage = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadClips = async () => {
    try {
      setLoading(true);
      const campaigns = await fetchCreatorCampaigns();
      const allClips: Clip[] = [];

      campaigns.forEach(campaign => {
        campaign.submitted_clips?.forEach(clip => {
          allClips.push({ ...clip, campaignName: campaign.name });
        });
        campaign.accepted_clips?.forEach(clip => {
          allClips.push({ ...clip, campaignName: campaign.name });
        });
      });

      // Sort by submission date, newest first
      allClips.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      
      setClips(allClips);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions.");
      toast({
        title: "Error",
        description: err.message || "Failed to load submissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClips();
  }, []);

  const handleDeleteConfirmation = (clipId: number) => {
    setDeletingClipId(clipId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClip = async () => {
    if (deletingClipId === null) return;
    try {
      setLoading(true); // Indicate loading while deleting
      await deleteClip(deletingClipId);
      toast({
        title: "Clip Deleted",
        description: "Your clip has been successfully deleted.",
      });
      await loadClips(); // Reload clips after deletion
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete clip.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setDeletingClipId(null);
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="text-red-500 text-center p-4">{error}</div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-4xl font-bold text-white">Your Submissions</h1>
          <p className="text-gray-400 mt-2">Track the status of all your submitted clips.</p>
        </header>

        <div className="bg-[#18181B] rounded-lg border border-white/10 overflow-hidden">
          {clips.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No clips submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Clip ID</TableHead>
                    <TableHead>Clip URL</TableHead>
                    <TableHead>View Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clips.map((clip) => {
                    const statusInfo = getClipStatusInfo(clip);
                    return (
                      <TableRow key={clip.id}>
                        <TableCell className="font-medium text-white">{clip.campaignName}</TableCell>
                        <TableCell className="text-gray-300">{clip.id}</TableCell>
                        <TableCell>
                          <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            View Clip <LinkIcon className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-gray-300">{clip.view_count}</TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            {statusInfo.icon} {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleDeleteConfirmation(clip.id)}
                            disabled={deletingClipId === clip.id}
                          >
                            {deletingClipId === clip.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your clip submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
};

export default SubmissionsPage;
