interface ReaderBookRowProps {
  title: string;
  progress: number;
  kidColor: string;
}

export const ReaderBookRow = ({ title, progress, kidColor }: ReaderBookRowProps) => (
  <div className="rounded-lg bg-secondary/60 px-3 py-2">
    <div className="flex justify-between text-sm mb-1">
      <span className="truncate text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground ml-2">{progress}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${progress}%`, backgroundColor: kidColor }}
      />
    </div>
  </div>
);
