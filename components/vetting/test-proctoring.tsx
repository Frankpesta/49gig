// @ts-nocheck — Convex useMutation + generated api triggers TS2589 in this module.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, VideoOff, Shield, Loader2 } from "lucide-react";

type Segment = "english" | "skills";

type TestProctoringGateProps = {
  userId: Id<"users">;
  segment: Segment;
  title: string;
  description: string;
  onReady: () => void;
  children: React.ReactNode;
};

/** Webcam consent gate before timed vetting segments; telemetry is handled after consent. */
export function TestProctoringGate({
  userId,
  segment,
  title,
  description,
  onReady,
  children,
}: TestProctoringGateProps) {
  const [phase, setPhase] = useState<"consent" | "ready">("consent");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const confirmCamera = useMutation(api.vetting.mutations.confirmProctoringCamera);
  const submitMetrics = useMutation(api.vetting.mutations.submitProctoringMetrics);

  const flushMetrics = useCallback(
    async (delta: {
      visibilityHiddenMs?: number;
      windowBlurEvents?: number;
      pasteAttempts?: number;
      cameraOffSegments?: number;
      fullscreenExitEvents?: number;
    }) => {
      const has =
        (delta.visibilityHiddenMs ?? 0) > 0 ||
        (delta.windowBlurEvents ?? 0) > 0 ||
        (delta.pasteAttempts ?? 0) > 0 ||
        (delta.cameraOffSegments ?? 0) > 0 ||
        (delta.fullscreenExitEvents ?? 0) > 0;
      if (!has) return;
      try {
        await submitMetrics({ userId, delta });
      } catch {
        /* non-blocking */
      }
    },
    [submitMetrics, userId]
  );

  useEffect(() => {
    if (phase !== "ready") return;

    const acc = {
      visibilityHiddenMs: 0,
      windowBlurEvents: 0,
      pasteAttempts: 0,
      cameraOffSegments: 0,
      fullscreenExitEvents: 0,
    };
    let hiddenSince: number | null = null;

    const onVisibility = () => {
      if (document.hidden) {
        hiddenSince = Date.now();
      } else if (hiddenSince !== null) {
        acc.visibilityHiddenMs += Date.now() - hiddenSince;
        hiddenSince = null;
      }
    };

    const onBlur = () => {
      acc.windowBlurEvents += 1;
    };

    const onPaste = () => {
      acc.pasteAttempts += 1;
    };

    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        acc.fullscreenExitEvents += 1;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("fullscreenchange", onFullscreen);

    const stream = streamRef.current;
    const videoTrack = stream?.getVideoTracks()[0];
    const onTrackEnded = () => {
      acc.cameraOffSegments += 1;
    };
    videoTrack?.addEventListener("ended", onTrackEnded);

    const interval = window.setInterval(() => {
      void flushMetrics({ ...acc });
      acc.visibilityHiddenMs = 0;
      acc.windowBlurEvents = 0;
      acc.pasteAttempts = 0;
      acc.cameraOffSegments = 0;
      acc.fullscreenExitEvents = 0;
    }, 45000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("fullscreenchange", onFullscreen);
      videoTrack?.removeEventListener("ended", onTrackEnded);
      window.clearInterval(interval);
      if (hiddenSince !== null) {
        acc.visibilityHiddenMs += Date.now() - hiddenSince;
      }
      void flushMetrics({ ...acc });
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [phase, flushMetrics]);

  const enableCamera = async () => {
    setError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPreviewActive(true);
      await confirmCamera({
        userId,
        segment,
      });
      setPhase("ready");
      onReady();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not access the camera. Check permissions and try again.";
      setError(msg);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } finally {
      setStarting(false);
    }
  };

  if (phase === "consent") {
    return (
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription className="text-pretty leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border bg-muted/20 aspect-video max-h-[200px]">
            <video
              ref={videoRef}
              className="h-full w-full object-cover scale-x-[-1]"
              playsInline
              muted
            />
            {!previewActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 text-muted-foreground text-sm p-4 text-center">
                <VideoOff className="h-10 w-10 opacity-50" />
                Preview appears after you allow the camera
              </div>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="button" className="w-full gap-2 h-11" onClick={() => void enableCamera()} disabled={starting}>
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting camera…
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Allow camera &amp; continue
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

/**
 * During an active skill session, record the same lightweight signals as {@link TestProctoringGate}
 * without keeping the gate mounted.
 */
export function useSkillProctoringTelemetry(
  userId: Id<"users"> | undefined,
  active: boolean
) {
  const submitMetrics = useMutation(api.vetting.mutations.submitProctoringMetrics);

  useEffect(() => {
    if (!userId || !active) return;

    const acc = {
      visibilityHiddenMs: 0,
      windowBlurEvents: 0,
      pasteAttempts: 0,
      cameraOffSegments: 0,
      fullscreenExitEvents: 0,
    };
    let hiddenSince: number | null = null;

    const flush = () => {
      const has =
        acc.visibilityHiddenMs > 0 ||
        acc.windowBlurEvents > 0 ||
        acc.pasteAttempts > 0 ||
        acc.cameraOffSegments > 0 ||
        acc.fullscreenExitEvents > 0;
      if (!has) return;
      void submitMetrics({
        userId,
        delta: { ...acc },
      });
      acc.visibilityHiddenMs = 0;
      acc.windowBlurEvents = 0;
      acc.pasteAttempts = 0;
      acc.cameraOffSegments = 0;
      acc.fullscreenExitEvents = 0;
    };

    const onVisibility = () => {
      if (document.hidden) hiddenSince = Date.now();
      else if (hiddenSince !== null) {
        acc.visibilityHiddenMs += Date.now() - hiddenSince;
        hiddenSince = null;
      }
    };
    const onBlur = () => {
      acc.windowBlurEvents += 1;
    };
    const onPaste = () => {
      acc.pasteAttempts += 1;
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) acc.fullscreenExitEvents += 1;
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("fullscreenchange", onFullscreen);

    const interval = window.setInterval(flush, 45000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.clearInterval(interval);
      if (hiddenSince !== null) acc.visibilityHiddenMs += Date.now() - hiddenSince;
      flush();
    };
  }, [userId, active, submitMetrics]);
}
