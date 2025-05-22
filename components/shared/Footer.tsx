import Image from 'next/image';
import img from '@/public/white-logo.svg';
import Link from 'next/link';
import Container from './container';
import { Icon } from '@/components/ui/icon';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#00254F] to-[#00365D]">
      <Container className="py-6 md:py-12 lg:py-20">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <Image
                src={img}
                alt="Ship With Godday Logo"
                className="w-48"
              />
            </Link>
            <p className="mt-4 text-gray-400 max-w-xs">
              Your trusted partner for seamless shipping solutions
              between China and Ghana. Experience reliable logistics
              services tailored to your needs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-white">
                Services
              </h2>
              <ul className="text-gray-400 font-medium">
                <li className="mb-4">
                  <Link
                    href="/procurement"
                    className="hover:text-primary transition-colors">
                    Procurement services
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    href="/shipping"
                    className="hover:text-primary transition-colors">
                    Shipping Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/payment"
                    className="hover:text-primary transition-colors">
                    Payment Facilitation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-white">
                Company
              </h2>
              <ul className="text-gray-400 font-medium">
                <li className="mb-4">
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/schedule"
                    className="hover:text-primary transition-colors">
                    Schedule a Call
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-white">
                Legal
              </h2>
              <ul className="text-gray-400 font-medium">
                <li className="mb-4">
                  <Link
                    href="/privacy-policy"
                    className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-and-conditions"
                    className="hover:text-primary transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-700 lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-400 sm:text-center">
            © {new Date().getFullYear()} Ship With Godday™. All
            rights reserved.
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0 space-x-6">
            <a
              href="https://instagram.com/shipwithgodday"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors">
              <Icon name="Instagram" className="w-5 h-5" />
              <span className="sr-only">Instagram page</span>
            </a>
            <a
              href="https://tiktok.com/@shipwithgodday"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
              <span className="sr-only">TikTok page</span>
            </a>
            <a
              href="https://wa.me/+233302768899"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="sr-only">WhatsApp</span>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
