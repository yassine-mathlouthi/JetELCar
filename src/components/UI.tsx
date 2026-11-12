import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import {
  X,
  Users,
  SearchX,
  BusFront,
  TramFront,
  TrainFront,
  Check,
  Clock3,
  Ban,
} from "lucide-react";
import {
  crowdLabels,
  modeLabels,
  statusLabels,
  type Crowd,
  type Line,
  type Mode,
  type ServiceStatus,
} from "../data";

export function ModeIcon({ mode, size = 16 }: { mode: Mode; size?: number }) {
  const Icon =
    mode === "metro" ? TramFront : mode === "tgm" ? TrainFront : BusFront;
  return <Icon size={size} aria-hidden="true" />;
}
export function ModeBadge({ mode }: { mode: Mode }) {
  return (
    <span className={`mode-badge ${mode}`}>
      <ModeIcon mode={mode} size={13} />
      {modeLabels[mode]}
    </span>
  );
}
export function StatusBadge({ status }: { status: ServiceStatus }) {
  const Icon =
    status === "normal" ? Check : status === "delayed" ? Clock3 : Ban;
  return (
    <span className={`service-badge ${status}`}>
      <Icon size={12} />
      {statusLabels[status]}
    </span>
  );
}
export function LineBadge({
  line,
  small = false,
}: {
  line: Line;
  small?: boolean;
}) {
  return (
    <span
      className={`line-badge ${small ? "small" : ""}`}
      style={{ "--line-color": line.color } as CSSProperties}
      title={`${modeLabels[line.mode]} ${line.id}`}
    >
      {line.id}
    </span>
  );
}
export function CrowdBadge({ level }: { level: Crowd }) {
  return (
    <span className={`crowd-badge ${level}`}>
      <Users size={13} />
      {crowdLabels[level]}
    </span>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <SearchX size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current!;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Fermer" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
