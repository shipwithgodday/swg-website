import { Check } from 'lucide-react';

interface ServiceItemProps {
  text: string;
}

export function ServiceItem({ text }: ServiceItemProps) {
  return (
    <div className="flex items-center bg-white/15 backdrop-blur-sm p-4 rounded-lg hover:bg-white/25 transition-colors">
      <div className="bg-primary rounded-full p-1.5 mr-4">
        <Check size={16} className="text-white" />
      </div>
      <span className="text-gray-50 font-medium text-sm sm:text-base">
        {text}
      </span>
    </div>
  );
}
