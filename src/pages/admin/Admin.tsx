import React, { useEffect, useState } from "react";
import { fetchAdminCampaigns, adminUpdateClip, deleteClipAdmin, Campaign, SubmittedClipData, AcceptedClipData } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Trash2, XCircle, CheckCircle, Clock, ExternalLink, Eye, Calendar, Hash, MessageCircle } from "lucide-react";

const AdminPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminCampaigns()
      .then(setCampaigns)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      });
  }, []);

  const toggle = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleAction = async (clipId: number, status: "accepted" | "rejected") => {
    let feedback: string | undefined;
    if (status === "rejected") {
      feedback = prompt("Provide feedback for the creator (optional)") || undefined;
    }
    try {
      await adminUpdateClip(clipId, { status, feedback });
      const updated = await fetchAdminCampaigns();
      setCampaigns(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  const handleDelete = async (clipId: number) => {
    if (!window.confirm('Delete this clip?')) return;
    try {
      await deleteClipAdmin(clipId);
      const updated = await fetchAdminCampaigns();
      setCampaigns(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  const formatUrl = (url: string) => {
    if (url.length > 50) {
      return url.substring(0, 30) + '...' + url.substring(url.length - 15);
    }
    return url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Clip Review</h1>
          <p className="text-gray-600">Review and manage submitted clips across all campaigns</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Campaigns */}
        <div className="space-y-6">
          {campaigns.map(camp => (
            <div key={camp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Campaign Header */}
              <button
                onClick={() => toggle(camp.id)}
                className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900">{camp.name}</h2>
                  <div className="flex space-x-2">
                    {camp.submitted_clips && camp.submitted_clips.length > 0 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {camp.submitted_clips.length} Pending
                      </Badge>
                    )}
                    {camp.accepted_clips && camp.accepted_clips.length > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {camp.accepted_clips.length} Accepted
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedId === camp.id ? "rotate-180" : "rotate-0"}`} />
              </button>

              {/* Campaign Content */}
              {expandedId === camp.id && (
                <div className="px-6 pb-6 space-y-8">
                  {/* Submitted Clips Section */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Submitted Clips</h3>
                    </div>
                    
                    {camp.submitted_clips && camp.submitted_clips.length > 0 ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {camp.submitted_clips.map((clip: SubmittedClipData) => (
                          <div
                            key={clip.id}
                            className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${clip.is_deleted_by_admin ? 'opacity-60 grayscale' : ''}`}
                          >
                            {/* Clip Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <a
                                  href={clip.clip_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="break-all">{formatUrl(clip.clip_url)}</span>
                                </a>
                              </div>
                              
                              <button
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                onClick={() => handleDelete(clip.id)}
                                title="Delete Clip"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Status and Feedback */}
                            <div className="mb-3">
                              {clip.is_deleted_by_admin ? (
                                <Badge variant="destructive" className="mb-2">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejected
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 mb-2">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending Review
                                </Badge>
                              )}
                              
                              {clip.feedback && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                  <span className="font-semibold text-red-800">Feedback:</span>
                                  <p className="text-red-700 mt-1">{clip.feedback}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {!clip.is_deleted_by_admin && (
                              <div className="flex space-x-2">
                                <button
                                  className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                                  onClick={() => handleAction(clip.id, "accepted")}
                                >
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  Approve
                                </button>
                                <button
                                  className="flex-1 bg-red-600 text-white text-sm py-2 px-3 rounded-md hover:bg-red-700 transition-colors font-medium"
                                  onClick={() => handleAction(clip.id, "rejected")}
                                >
                                  <XCircle className="w-4 h-4 inline mr-1" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No clips submitted yet.</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Accepted Clips Section */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Accepted Clips</h3>
                    </div>

                    {camp.accepted_clips && camp.accepted_clips.length > 0 ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {camp.accepted_clips.map((clip: AcceptedClipData) => (
                          <div
                            key={clip.id}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                          >
                            {/* Clip Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <a
                                  href={clip.clip_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="break-all">{formatUrl(clip.clip_url)}</span>
                                </a>
                              </div>
                              
                              <button
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                onClick={() => handleDelete(clip.id)}
                                title="Delete Clip"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Status Badge */}
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 mb-3">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accepted
                            </Badge>

                            {/* Clip Details */}
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center space-x-2 text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span>Submitted: {formatDate(clip.submitted_at)}</span>
                              </div>
                              
                              {clip.media_id && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Hash className="w-3 h-3" />
                                  <span>Media ID: {clip.media_id}</span>
                                </div>
                              )}
                              
                              {clip.view_count && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Eye className="w-3 h-3" />
                                  <span>Views: {clip.view_count.toLocaleString()}</span>
                                </div>
                              )}
                              
                              {clip.caption && (
                                <div className="flex items-start space-x-2 text-gray-600">
                                  <MessageCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{clip.caption}</span>
                                </div>
                              )}
                              
                              {clip.instagram_posted_at && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>Posted on IG: {formatDate(clip.instagram_posted_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No clips accepted yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {campaigns.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No campaigns found</h3>
            <p className="text-gray-500">There are no campaigns to review at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;