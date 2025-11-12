import ProgressBar from '../ProgressBar';

export default function ProgressBarExample() {
  return (
    <div className="p-8 bg-background">
      <ProgressBar current={7} total={10} score={65} />
    </div>
  );
}
