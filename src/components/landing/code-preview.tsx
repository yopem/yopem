const CodePreview = () => {
  return (
    <div className="border-border/50 bg-card/50 text-muted-foreground mt-8 rounded-lg border p-4 font-mono text-xs">
      <div className="mb-2 flex gap-2">
        <span className="text-muted-foreground">const</span> yopem =
        <span className="text-foreground">new</span> Yopem();
      </div>
      <div className="flex gap-2">
        <span className="text-muted-foreground">await</span> yopem.generate(
        {"{"}
      </div>
      <div className="text-foreground pl-4">model: &apos;best&apos;,</div>
      <div className="text-foreground pl-4">
        prompt: &apos;Hello world&apos;
      </div>
      <div>{"});"}</div>
    </div>
  )
}

export default CodePreview
