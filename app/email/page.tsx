'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { Link as LinkTiptap } from '@tiptap/extension-link';

// Define the form schema
const emailFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Email content is required'),
  recipients: z.array(z.string()),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

// Tiptap Menu Button component
const MenuButton = ({
  onClick,
  active = false,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-all duration-200 ${
      active
        ? 'bg-white/20 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`}
    type="button">
    {children}
  </button>
);

// Custom styles to apply to the editor
const customStyles = `
  .ProseMirror {
    min-height: 250px;
    padding: 1rem;
    outline: none;
    color: white;
  }
  
  .ProseMirror p {
    margin-bottom: 0.75rem;
  }
  
  .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  .ProseMirror li {
    margin-bottom: 0.25rem;
  }
  
  .ProseMirror a {
    color: #60a5fa;
    text-decoration: underline;
  }
`;

export default function EmailPage() {
  const [emails, setEmails] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [editorContent, setEditorContent] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: '',
      content: '',
      recipients: [],
    },
  });

  // Setup TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      LinkTiptap.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);
      setValue('content', html, { shouldValidate: true });
    },
  });

  // Fetch emails from the database
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch('/api/bookings/emails');
        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }
        const data = await response.json();
        setEmails(data.emails);
      } catch (error) {
        console.error('Error fetching emails:', error);
        setStatus({
          success: false,
          message: 'Failed to load recipient list',
        });
      }
    };

    fetchEmails();
  }, []);

  useEffect(() => {
    // Update form recipients when selected emails change
    setValue('recipients', selectedEmails, { shouldValidate: true });
  }, [selectedEmails, setValue]);

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const selectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map((email) => email.value));
    }
  };

  const onSubmit = async (data: EmailFormValues) => {
    setLoading(true);
    setStatus(null);

    try {
      data.content = editorContent;
      data.recipients = selectedEmails;

      if (selectedEmails.length === 0) {
        setStatus({
          success: false,
          message: 'Please select at least one recipient',
        });
        setLoading(false);
        return;
      }

      if (!data.content || data.content === '<p></p>') {
        setStatus({
          success: false,
          message: 'Please enter email content',
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: data.subject,
          content: data.content,
          recipients: data.recipients,
        }),
      });

      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        setStatus({
          success: true,
          message: 'Emails sent successfully!',
        });
        reset();
        setSelectedEmails([]);
        editor?.commands.clearContent();
      } else {
        setStatus({
          success: false,
          message: result.error || 'Failed to send emails',
        });
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      setStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while sending emails',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const canSubmit =
    !loading &&
    selectedEmails.length > 0 &&
    editorContent &&
    editorContent !== '<p></p>';

  return (
    <main
      style={{
        backgroundImage: "url('/booking-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="w-full max-w-4xl mx-auto px-4 py-8 z-10">
        <style jsx global>
          {customStyles}
        </style>

        <div className="bg-[#00365D] bg-opacity-70 shadow-lg rounded-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Bulk Email Sender
              </h1>
              <p className="text-gray-200">
                Send emails to multiple recipients from your customer
                base
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/signup">Add Customer</Link>
              </Button>
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`p-4 mb-6 rounded-lg shadow-sm ${
              status.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-[#00365D] bg-opacity-70 shadow-lg rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              {...register('subject')}
              className="w-full p-3 bg-white/15 backdrop-blur-sm text-white placeholder:text-gray-300 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter email subject"
            />
            {errors.subject && (
              <p className="text-red-400 text-sm mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="bg-[#00365D] bg-opacity-70 shadow-lg rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Email Content
            </label>
            <div className="border border-white/20 rounded-lg overflow-hidden">
              <div className="bg-[#00365D] p-2 border-b border-white/20 flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 border-r border-white/20 pr-3 mr-3">
                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().toggleBold().run()
                    }
                    active={editor.isActive('bold')}
                    title="Bold">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                    </svg>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().toggleItalic().run()
                    }
                    active={editor.isActive('italic')}
                    title="Italic">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <line x1="19" y1="4" x2="10" y2="4"></line>
                      <line x1="14" y1="20" x2="5" y2="20"></line>
                      <line x1="15" y1="4" x2="9" y2="20"></line>
                    </svg>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().toggleStrike().run()
                    }
                    active={editor.isActive('strike')}
                    title="Strikethrough">
                    <s>S</s>
                  </MenuButton>
                </div>

                <div className="flex items-center space-x-1 border-r border-white/20 pr-3 mr-3">
                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    active={editor.isActive('bulletList')}
                    title="Bullet List">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <circle cx="3" cy="6" r="2"></circle>
                      <circle cx="3" cy="12" r="2"></circle>
                      <circle cx="3" cy="18" r="2"></circle>
                    </svg>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    active={editor.isActive('orderedList')}
                    title="Numbered List">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <line x1="10" y1="6" x2="21" y2="6"></line>
                      <line x1="10" y1="12" x2="21" y2="12"></line>
                      <line x1="10" y1="18" x2="21" y2="18"></line>
                      <path d="M4 6h1v4"></path>
                      <path d="M4 10h2"></path>
                      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                    </svg>
                  </MenuButton>
                </div>

                <div className="flex items-center space-x-1 border-r border-white/20 pr-3 mr-3">
                  <MenuButton
                    onClick={() => {
                      const url = window.prompt('Enter URL');
                      if (url) {
                        editor
                          .chain()
                          .focus()
                          .setLink({ href: url })
                          .run();
                      }
                    }}
                    active={editor.isActive('link')}
                    title="Insert Link">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </MenuButton>
                </div>

                <div className="flex items-center space-x-1">
                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().setColor('#60a5fa').run()
                    }
                    active={editor.isActive('textStyle', {
                      color: '#60a5fa',
                    })}
                    title="Blue Text">
                    <span className="text-blue-400 font-medium">
                      A
                    </span>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().setColor('#f87171').run()
                    }
                    active={editor.isActive('textStyle', {
                      color: '#f87171',
                    })}
                    title="Red Text">
                    <span className="text-red-400 font-medium">
                      A
                    </span>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().setColor('#ffffff').run()
                    }
                    active={editor.isActive('textStyle', {
                      color: '#ffffff',
                    })}
                    title="White Text">
                    <span className="text-white font-medium">A</span>
                  </MenuButton>
                </div>
              </div>

              <EditorContent
                editor={editor}
                className="prose max-w-none bg-[#00365D] bg-opacity-70"
              />
            </div>

            {errors.content && (
              <p className="text-red-400 text-sm mt-2">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="bg-[#00365D] bg-opacity-70 shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-200">
                Recipients
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                {selectedEmails.length === emails.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="border border-white/20 rounded-lg p-4 max-h-[300px] overflow-y-auto bg-[#00365D] bg-opacity-70">
              {emails.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No emails found in bookings
                </p>
              ) : (
                <div className="space-y-2">
                  {emails.map((email) => (
                    <div
                      key={email.value}
                      className="flex items-center">
                      <input
                        type="checkbox"
                        id={`email-${email.value}`}
                        checked={selectedEmails.includes(email.value)}
                        onChange={() => toggleEmail(email.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`email-${email.value}`}
                        className="ml-2 text-sm text-gray-200">
                        {email.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEmails.length === 0 && (
              <p className="text-red-400 text-sm mt-2">
                Please select at least one recipient
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full">
            {loading ? 'Sending...' : 'Send Emails'}
          </Button>
        </form>
      </div>
    </main>
  );
}
