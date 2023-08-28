/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import {
  CreatePostForm,
  PostCardSkeleton,
  PostList,
} from "./_components/posts";

export const runtime = "edge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerComponentClient<any>({ cookies });
  const { data } = await supabase.from("todos").select();
  return (
    <main className="flex h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center justify-center gap-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-pink-400">T3</span> Turbo
        </h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <CreatePostForm />
        <div className="h-[40vh] w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <PostList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
