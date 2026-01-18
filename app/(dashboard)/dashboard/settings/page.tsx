"use client";

import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Settings, Lock, Bell, Shield, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type SessionInfo = {
  _id: string;
  createdAt: number;
  expiresAt: number;
  lastRotatedAt: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  isActive: boolean;
  revokedAt?: number | null;
  revokedReason?: string | null;
};

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    inApp: true,
  });
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorTokenId, setTwoFactorTokenId] = useState<string | null>(null);
  const [twoFactorMode, setTwoFactorMode] = useState<"enable" | "disable" | null>(
    null
  );
  const [flutterwaveStatus, setFlutterwaveStatus] = useState<{
    connected: boolean;
    subaccountId?: string;
    accountName?: string;
    accountReference?: string;
    bankName?: string;
    bankCode?: string;
  } | null>(null);
  const [isFlutterwaveStatusLoading, setIsFlutterwaveStatusLoading] = useState(false);
  const [showSubaccountForm, setShowSubaccountForm] = useState(false);
  const [subaccountForm, setSubaccountForm] = useState({
    businessName: "",
    businessEmail: "",
    businessMobile: "",
    accountNumber: "",
    accountBank: "",
    country: "NG", // Default to Nigeria
  });

  const changePassword = useMutation(
    (api as any)["auth/mutations"].changePassword
  );
  const updateNotificationPreferences = useMutation(
    api.users.mutations.updateNotificationPreferences
  );
  const requestTwoFactorEnable = useMutation(
    (api as any)["auth/mutations"].requestTwoFactorEnable
  );
  const confirmTwoFactorEnable = useMutation(
    (api as any)["auth/mutations"].confirmTwoFactorEnable
  );
  const requestTwoFactorDisable = useMutation(
    (api as any)["auth/mutations"].requestTwoFactorDisable
  );
  const confirmTwoFactorDisable = useMutation(
    (api as any)["auth/mutations"].confirmTwoFactorDisable
  );
  const revokeSessionById = useMutation(
    (api as any)["auth/mutations"].revokeSessionById
  );
  const revokeOtherSessions = useMutation(
    (api as any)["auth/mutations"].revokeOtherSessions
  );
  const deleteAccount = useMutation(api.users.mutations.deleteAccount);
  const createSubaccount = useAction(
    (api as any)["payments/actions"].createSubaccount
  );
  const getSubaccountStatus = useAction(
    (api as any)["payments/actions"].getSubaccountStatus
  );

  const sessionsData = useQuery(
    (api as any)["auth/queries"].listSessionsForToken,
    sessionToken ? { sessionToken } : "skip"
  );
  const currentUser = useQuery(
    api.users.queries.getCurrentUserProfile,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSessionToken(localStorage.getItem("sessionToken"));
    }
  }, []);

  useEffect(() => {
    const userPreferences = (user as any)?.notificationPreferences;
    if (userPreferences) {
      setNotificationPrefs(userPreferences);
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  const twoFactorEnabled = (user as any)?.twoFactorEnabled ?? false;
  const flutterwaveSubaccountId = (currentUser as any)?.flutterwaveSubaccountId;
  const isFreelancer = user.role === "freelancer";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        userId: user._id,
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updateNotificationPreferences({
        preferences: notificationPrefs,
        userId: user._id,
      });
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update preferences"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestTwoFactor = async (mode: "enable" | "disable") => {
    setIsSaving(true);
    try {
      const result =
        mode === "enable"
          ? await requestTwoFactorEnable({ userId: user._id })
          : await requestTwoFactorDisable({ userId: user._id });
      setTwoFactorTokenId(result.twoFactorTokenId);
      setTwoFactorMode(mode);
      toast.success("Verification code sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send code");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    if (!twoFactorTokenId || !twoFactorMode) return;
    setIsSaving(true);
    try {
      if (twoFactorMode === "enable") {
        await confirmTwoFactorEnable({
          tokenId: twoFactorTokenId,
          code: twoFactorCode,
          userId: user._id,
        });
      } else {
        await confirmTwoFactorDisable({
          tokenId: twoFactorTokenId,
          code: twoFactorCode,
          userId: user._id,
        });
      }
      setTwoFactorTokenId(null);
      setTwoFactorMode(null);
      setTwoFactorCode("");
      toast.success("Two-factor authentication updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!subaccountForm.businessName || !subaccountForm.businessEmail || 
        !subaccountForm.businessMobile || !subaccountForm.accountNumber || 
        !subaccountForm.accountBank) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSaving(true);
    try {
      const result = await createSubaccount({
        freelancerId: user._id,
        businessName: subaccountForm.businessName,
        businessEmail: subaccountForm.businessEmail || user.email,
        businessMobile: subaccountForm.businessMobile,
        accountNumber: subaccountForm.accountNumber,
        accountBank: subaccountForm.accountBank,
        country: subaccountForm.country,
        splitType: "percentage",
        splitValue: 0, // Platform keeps 100% initially, can adjust split later
      });
      
      if (result.success) {
        toast.success("Flutterwave subaccount created successfully");
        setShowSubaccountForm(false);
        setSubaccountForm({ 
          businessName: "", 
          businessEmail: "", 
          businessMobile: "", 
          accountNumber: "", 
          accountBank: "", 
          country: "NG" 
        });
        // Refresh status
        handleRefreshFlutterwaveStatus();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create subaccount"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshFlutterwaveStatus = async () => {
    setIsFlutterwaveStatusLoading(true);
    try {
      const result = await getSubaccountStatus({ freelancerId: user._id });
      setFlutterwaveStatus(result || null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to refresh status"
      );
    } finally {
      setIsFlutterwaveStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!isFreelancer) {
      return;
    }
    let isMounted = true;
    setIsFlutterwaveStatusLoading(true);
    getSubaccountStatus({ freelancerId: user._id })
      .then((result) => {
        if (isMounted) {
          setFlutterwaveStatus(result || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFlutterwaveStatus(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsFlutterwaveStatusLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [getSubaccountStatus, user._id, isFreelancer]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!sessionToken) return;
    setIsSaving(true);
    try {
      await revokeSessionById({ sessionToken, sessionId: sessionId as any });
      toast.success("Session revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!sessionToken) return;
    setIsSaving(true);
    try {
      await revokeOtherSessions({ sessionToken });
      toast.success("Signed out of other sessions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke sessions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      "This will permanently delete your account and revoke all sessions. Continue?"
    );
    if (!firstConfirm) return;
    const secondConfirm = window.confirm("This action cannot be undone. Delete account?");
    if (!secondConfirm) return;

    setIsDeleting(true);
    try {
      await deleteAccount({ userId: user._id });
      localStorage.removeItem("sessionToken");
      logout();
      toast.success("Account deleted");
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user.role} disabled />
          </div>
          <div className="space-y-2">
            <Label>Account Status</Label>
            <Input value={user.status} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      {user.authProvider === "email" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security by verifying sign-ins via email.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border px-3 py-1 text-xs font-semibold">
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </div>
              <Button
                variant={twoFactorEnabled ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  handleRequestTwoFactor(twoFactorEnabled ? "disable" : "enable")
                }
                disabled={isSaving}
              >
                {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
            </div>
            {twoFactorMode && (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Verification Code</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="twoFactorCode"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    placeholder="Enter code"
                    className="sm:max-w-[220px]"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleConfirmTwoFactor}
                    disabled={isSaving || !twoFactorCode}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-border" />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Active Sessions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeOtherSessions}
                disabled={isSaving || !sessionToken}
              >
                Sign out other sessions
              </Button>
            </div>
            {!sessionToken ? (
              <p className="text-sm text-muted-foreground">
                Session management is only available for password-based logins.
              </p>
            ) : sessionsData === undefined ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sessions...
              </div>
            ) : sessionsData.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active sessions found.
              </p>
            ) : (
              <div className="space-y-2">
                {sessionsData.sessions.map((session: SessionInfo) => {
                  const isCurrent = session._id === sessionsData.currentSessionId;
                  return (
                    <div
                      key={session._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {session.userAgent || "Unknown device"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created{" "}
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            Current session
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSession(session._id)}
                            disabled={isSaving}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isFreelancer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payouts (Flutterwave)
            </CardTitle>
            <CardDescription>
              Set up your Flutterwave subaccount to receive payouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {flutterwaveStatus?.connected ? "Flutterwave connected" : "Flutterwave not connected"}
              </p>
              <p className="text-xs text-muted-foreground">
                {flutterwaveStatus?.connected
                  ? "Your payouts will be sent to your Flutterwave subaccount."
                  : "Create a subaccount to enable payouts."}
              </p>
              {flutterwaveStatus?.connected && (
                <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1 text-xs text-muted-foreground">
                  {isFlutterwaveStatusLoading ? (
                    <span>Loading details...</span>
                  ) : flutterwaveStatus ? (
                    <div className="space-y-1">
                      {flutterwaveStatus.accountName && (
                        <div>
                          Account Name: <span className="font-medium text-foreground">{flutterwaveStatus.accountName}</span>
                        </div>
                      )}
                      {flutterwaveStatus.bankName && (
                        <div>
                          Bank: <span className="font-medium text-foreground">{flutterwaveStatus.bankName}</span>
                        </div>
                      )}
                      {flutterwaveStatus.accountReference && (
                        <div>
                          Account Reference: <span className="font-medium text-foreground font-mono">{flutterwaveStatus.accountReference}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>Unable to load Flutterwave status.</span>
                  )}
                </div>
              )}
            </div>

            {!flutterwaveStatus?.connected && (
              <div className="space-y-4">
                {!showSubaccountForm ? (
                  <Button
                    onClick={() => setShowSubaccountForm(true)}
                    className="w-full"
                  >
                    Create Flutterwave Subaccount
                  </Button>
                ) : (
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        placeholder="Your business or account name"
                        value={subaccountForm.businessName}
                        onChange={(e) =>
                          setSubaccountForm((prev) => ({ ...prev, businessName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        placeholder={user.email || "your@email.com"}
                        value={subaccountForm.businessEmail}
                        onChange={(e) =>
                          setSubaccountForm((prev) => ({ ...prev, businessEmail: e.target.value }))
                        }
                      />
                      {user.email && (
                        <p className="text-xs text-muted-foreground">
                          Defaults to your account email if not provided
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessMobile">Phone Number *</Label>
                      <Input
                        id="businessMobile"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={subaccountForm.businessMobile}
                        onChange={(e) =>
                          setSubaccountForm((prev) => ({ ...prev, businessMobile: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountBank">Bank Code *</Label>
                      <Input
                        id="accountBank"
                        placeholder="e.g., 044 for Access Bank (Nigeria)"
                        value={subaccountForm.accountBank}
                        onChange={(e) =>
                          setSubaccountForm((prev) => ({ ...prev, accountBank: e.target.value }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Get bank codes from Flutterwave's Get Banks API or documentation
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Bank Account Number *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Your bank account number"
                        value={subaccountForm.accountNumber}
                        onChange={(e) =>
                          setSubaccountForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <select
                        id="country"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={subaccountForm.country}
                        onChange={(e) =>
                          setSubaccountForm((prev) => ({ ...prev, country: e.target.value }))
                        }
                      >
                        <option value="NG">Nigeria</option>
                        <option value="KE">Kenya</option>
                        <option value="GH">Ghana</option>
                        <option value="ZA">South Africa</option>
                        <option value="UG">Uganda</option>
                        <option value="TZ">Tanzania</option>
                        <option value="RW">Rwanda</option>
                        <option value="ZM">Zambia</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSubaccountForm(false);
                          setSubaccountForm({ 
                            businessName: "", 
                            businessEmail: "", 
                            businessMobile: "", 
                            accountNumber: "", 
                            accountBank: "", 
                            country: "NG" 
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateSubaccount}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Subaccount"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {flutterwaveStatus?.connected && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefreshFlutterwaveStatus}
                  disabled={isFlutterwaveStatusLoading}
                  className="flex-1"
                >
                  {isFlutterwaveStatusLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    "Refresh Status"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={notificationPrefs.email}
                onCheckedChange={(value) =>
                  setNotificationPrefs((prev) => ({
                    ...prev,
                    email: Boolean(value),
                  }))
                }
                id="notif-email"
              />
              <Label htmlFor="notif-email" className="text-sm">
                Email notifications
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={notificationPrefs.push}
                onCheckedChange={(value) =>
                  setNotificationPrefs((prev) => ({
                    ...prev,
                    push: Boolean(value),
                  }))
                }
                id="notif-push"
              />
              <Label htmlFor="notif-push" className="text-sm">
                Push notifications
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={notificationPrefs.inApp}
                onCheckedChange={(value) =>
                  setNotificationPrefs((prev) => ({
                    ...prev,
                    inApp: Boolean(value),
                  }))
                }
                id="notif-inapp"
              />
              <Label htmlFor="notif-inapp" className="text-sm">
                In-app notifications
              </Label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={isSaving}>
              Save preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Delete Account</Label>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

