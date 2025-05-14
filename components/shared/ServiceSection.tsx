import SectionHeader from '../shared/section-header';
import { ServiceItem } from './ServiceItem';

interface ServiceSectionProps {
  title: string;
  subtitle: string;
  highlightedWord: string;
  items: string[];
}

export function ServiceSection({
  title,
  subtitle,
  highlightedWord,
  items,
}: ServiceSectionProps) {
  return (
    <div className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 first:mt-0">
      <div>
        <div className="hidden md:block">
          <SectionHeader size="md" highlightedWord={highlightedWord}>
            {title}
          </SectionHeader>
        </div>
        <div className="block md:hidden">
          <SectionHeader size="sm" highlightedWord={highlightedWord}>
            {title}
          </SectionHeader>
        </div>
        <p className="text-base sm:text-lg text-gray-500 mt-2 italic">
          {subtitle}
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#00254F] to-[#00365D] rounded-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 mt-4 space-y-2 sm:space-y-3">
        {items.map((item, index) => (
          <ServiceItem key={index} text={item} />
        ))}
      </div>
    </div>
  );
}
