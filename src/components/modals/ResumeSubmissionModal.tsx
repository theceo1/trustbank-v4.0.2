"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";

interface ResumeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResumeSubmissionModal({ isOpen, onClose }: ResumeSubmissionModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    message: "",
    resume: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file",
        variant: "destructive"
      });
      return;
    }

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 20MB",
        variant: "destructive"
      });
      return;
    }

    setFormData((prev) => ({ ...prev, resume: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resume) {
      toast({
        title: "Resume required",
        description: "Please upload your resume",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Implement resume submission logic
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated delay

      toast({
        title: "Resume submitted",
        description: "Thank you for your interest! We'll review your application and get back to you soon.",
      });
      onClose();
      setFormData({
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        message: "",
        resume: null,
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-[500px]" aria-describedby="resume-submission-modal-desc">
        <DialogHeader>
          <DialogTitle id="resume-submission-modal-title">Submit Your Resume</DialogTitle>
          <DialogDescription id="resume-submission-modal-desc">
            Share your experience with us. We'll review your profile and reach out if there's a potential match.
          </DialogDescription>
        </DialogHeader>
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Cover Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us about yourself and why you're interested in joining trustBank..."
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resume">Resume</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("resume")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.resume ? formData.resume.name : "Upload Resume"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX (Max 20MB)
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
} 