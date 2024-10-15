"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Avatar,
  Button,
  Container,
  Group,
  NumberInput,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [handle, setHandle] = useState("");
  const [handleValidationError, setHandleValidationError] = useState("");
  const [handleAvailabilityError, setHandleAvailabilityError] = useState("");
  const [teamNumber, setTeamNumber] = useState<number | undefined>(undefined);
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(
    null,
  );
  const debouncedHandle = useDebounce(handle, 500);

  /**
   * Initialize form fields with user data when the user prop changes.
   */
  useEffect(() => {
    if (user) {
      setName(user.user_metadata.full_name || "");
      setAvatarUrl(user.user_metadata.avatar_url || "");
      setHandle(user.user_metadata.handle || "");
      setTeamNumber(user.user_metadata.team_number || undefined);
      setIsHandleAvailable(true);
    }
  }, [user]);

  /**
   * Check handle availability whenever the debounced handle changes.
   */
  useEffect(() => {
    async function checkHandleAvailability() {
      if (debouncedHandle && debouncedHandle !== user?.user_metadata.handle) {
        setIsHandleAvailable(null);
        try {
          const { data, error } = await supabase
            .from("users")
            .select("handle")
            .eq("handle", debouncedHandle)
            .maybeSingle();

          if (error) {
            console.error("Error checking handle availability:", error);
            setIsHandleAvailable(null);
            return;
          }

          setIsHandleAvailable(data === null);
        } catch (err) {
          console.error("Unexpected error:", err);
          setIsHandleAvailable(null);
        }
      } else {
        setIsHandleAvailable(null);
      }
    }

    if (debouncedHandle && !handleValidationError) {
      checkHandleAvailability();
    }
  }, [debouncedHandle, supabase, user, handleValidationError]);

  /**
   * Update availability error when isHandleAvailable changes.
   */
  useEffect(() => {
    if (!handleValidationError) {
      if (
        isHandleAvailable === false && handle !== user?.user_metadata.handle
      ) {
        setHandleAvailabilityError("This handle is already taken");
      } else {
        setHandleAvailabilityError("");
      }
    }
  }, [isHandleAvailable, handleValidationError, handle, user]);

  /**
   * Validate handle for correct characters.
   */
  const validateHandle = (value: string) => {
    const handleRegex = /^[a-zA-Z0-9_-]+$/;
    if (value && !handleRegex.test(value)) {
      setHandleValidationError(
        "Handle can only contain letters, numbers, underscores, and hyphens",
      );
      setIsHandleAvailable(null);
    } else {
      setHandleValidationError("");
    }
    setHandle(value);
  };

  /**
   * Update the user's profile in the database.
   */
  async function updateProfile() {
    try {
      setLoading(true);
      if (handleValidationError || handleAvailabilityError) {
        throw new Error(
          handleValidationError || handleAvailabilityError ||
            "Handle is not available",
        );
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl,
          handle: handle || null,
          team_number: teamNumber !== undefined ? teamNumber : null,
        },
      });
      if (error) throw error;
      notifications.show({
        title: "Success",
        message: "Profile updated",
        color: "green",
      });

      window.location.reload();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error
          ? error.message
          : "Error updating the data!",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Render the account form.
   */
  return (
    <Container size="sm">
      {user
        ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile();
            }}
          >
            <Avatar src={avatarUrl} size="xl" radius="xl" mx="auto" mb="md" />
            <TextInput
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              mb="md"
            />
            <TextInput
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              mb="md"
            />
            <TextInput
              label="Handle"
              value={handle}
              onChange={(e) => validateHandle(e.target.value)}
              error={handleValidationError || handleAvailabilityError}
              placeholder="your-unique-handle"
              mb="md"
              leftSection={<Text>@</Text>}
            />
            <NumberInput
              label="FRC Team Number"
              value={teamNumber !== undefined ? teamNumber : ""}
              onChange={(value) =>
                setTeamNumber(typeof value === "number" ? value : undefined)}
              placeholder="Enter your team number"
              min={1}
              max={9999}
              mb="md"
              allowDecimal={false}
              allowNegative={false}
            />
            <Group justify="flex-end" mt="md">
              {handle && handle === user?.user_metadata.handle && (
                <Button
                  component={Link}
                  href={`/user/${handle}`}
                  variant="outline"
                >
                  View Public Page
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                disabled={!!handleValidationError || !!handleAvailabilityError}
              >
                Update Profile
              </Button>
            </Group>
          </form>
        )
        : <Text>Loading...</Text>}
    </Container>
  );
}
