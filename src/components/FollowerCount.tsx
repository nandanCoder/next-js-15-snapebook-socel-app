"use client";
import useFollowerInfo from "@/hooks/useFollowerInfo";
import { formatNumber } from "@/lib/utils";
import { FollowerInfo } from "@/types/prisma.types";
interface FollowerCountProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowerCount({
  userId,
  initialState,
}: FollowerCountProps) {
  const { data } = useFollowerInfo(userId, initialState);
  return (
    <span>
      Followers:{" "}
      <span className="font-semibold"> {formatNumber(data.followers)}</span>
    </span>
  );
}
