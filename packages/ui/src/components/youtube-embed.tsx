import { PlayIcon } from "lucide-react"
import { memo, useCallback, useState } from "react"

const THUMBNAIL_SIZES = [
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default",
] as const

function YouTubeFacade({
  videoId,
  title,
  onActivate,
}: {
  videoId: string
  title?: string
  onActivate: () => void
}) {
  const [sizeIndex, setSizeIndex] = useState(0)
  const [hasError, setHasError] = useState(false)

  const currentSize = THUMBNAIL_SIZES[sizeIndex]
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/${currentSize}.jpg`

  const handleError = useCallback(() => {
    if (sizeIndex < THUMBNAIL_SIZES.length - 1) {
      setSizeIndex((prev) => prev + 1)
    } else {
      setHasError(true)
    }
  }, [sizeIndex])

  return (
    <button
      type="button"
      onClick={onActivate}
      className="group focus-visible:outline-ring relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={title ? `Play video: ${title}` : "Play YouTube video"}
    >
      {!hasError && (
        <img
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={handleError}
          className="absolute! inset-0! size-full! max-w-none! rounded-none! object-cover! object-center transition-transform duration-300 group-hover:scale-105"
          width={640}
          height={480}
        />
      )}
      <span className="absolute inset-0 bg-black/30 transition-colors duration-300 group-hover:bg-black/40" />
      <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 p-4 shadow-lg transition-transform duration-300 group-hover:scale-110">
        <PlayIcon className="h-8 w-8 fill-white text-white" />
      </span>
    </button>
  )
}

function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        className="absolute inset-0 h-full w-full border-0"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export const YouTubeEmbed = memo(function YouTubeEmbed({
  videoId,
  title,
}: {
  videoId: string
  title?: string
}) {
  const [activated, setActivated] = useState(false)
  const activate = useCallback(() => setActivated(true), [])

  if (activated) {
    return <YouTubePlayer videoId={videoId} />
  }

  return <YouTubeFacade videoId={videoId} title={title} onActivate={activate} />
})
