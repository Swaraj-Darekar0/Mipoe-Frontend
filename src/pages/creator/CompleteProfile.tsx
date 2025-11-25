import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchCreatorProfile, updateCreatorProfile, type CreatorProfile as ApiCreatorProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const CompleteProfile = () => {
  const [profile, setProfile] = useState<ApiCreatorProfile>({
    username: "",
    email: "",
    nickname: "",
    bio: "",
    phone: "", // Changed from phone_number to phone
    profile_completed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const data = await fetchCreatorProfile();
        if (data.profile_completed) {
          navigate("/creator/dashboard");
        } else {
          // Ensure all fields from ApiCreatorProfile are initialized
          setProfile({
            username: data.username || "",
            email: data.email || "",
            nickname: data.nickname || "",
            bio: data.bio || "",
            phone: data.phone || "", // Changed from phone_number to phone
            profile_completed: data.profile_completed,
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
          toast({
            title: "Error fetching profile",
            description: err.message,
            variant: "destructive",
          });
        } else {
          setError("An unknown error occurred");
          toast({
            title: "Error fetching profile",
            description: "An unknown error occurred",
            variant: "destructive",
          });
        }
      }
    };
    getProfile();
  }, [navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Use type assertion to ensure TypeScript knows 'name' can be a key of ApiCreatorProfile
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Only send the fields that are being updated by this form
      await updateCreatorProfile({
        nickname: profile.nickname,
        bio: profile.bio,
        phone: profile.phone, // Changed from phone_number to phone
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      navigate("/creator/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        toast({
          title: "Profile Update Failed",
          description: err.message,
          variant: "destructive",
        });
      } else {
        setError("An unknown error occurred");
        toast({
          title: "Profile Update Failed",
          description: "An unknown error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Complete Your Profile</h2>
        <p className="text-center text-gray-600 mb-8">
          Please provide the following details to complete your creator profile.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-gray-700 font-medium mb-2">Nickname</label>
            <Input
              id="nickname"
              name="nickname"
              type="text"
              value={profile.nickname}
              onChange={handleChange}
              placeholder="e.g., ViralVidsKing"
              required
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">Bio</label>
            <Textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself and your content..."
              rows={4}
              required
            />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-gray-700 font-medium mb-2">Phone Number</label>
            <Input
              id="phone_number"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={handleChange}
              placeholder="e.g., +91 9876543210"
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm mt-4 text-center">{error}</div>}
          <Button type="submit" className="w-full py-2" disabled={loading}>
            {loading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile; 