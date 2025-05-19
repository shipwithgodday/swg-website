'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';

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
        ? 'bg-blue-50 ring-1 ring-blue-200'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
    color: #1d4ed8;
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
      Link.configure({
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

  // Fetch emails from bookings
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch('/api/bookings/emails');
        const data = await response.json();

        if (data.emails) {
          setEmails(data.emails);
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
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

      const result = await response.json();

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
        message: 'An error occurred while sending emails',
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
    <main className="min-h-screen mt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <style jsx global>
          {customStyles}
        </style>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Email Sender
          </h1>
          <p className="text-gray-600">
            Send emails to multiple recipients from your bookings
          </p>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              {...register('subject')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter email subject"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Content
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-white p-2 border-b flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
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

                <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
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

                <div className="flex items-center space-x-1 border-r border-gray-200 pr-3 mr-3">
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
                      editor.chain().focus().setColor('#1d4ed8').run()
                    }
                    active={editor.isActive('textStyle', {
                      color: '#1d4ed8',
                    })}
                    title="Blue Text">
                    <span className="text-blue-700 font-medium">
                      A
                    </span>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().setColor('#dc2626').run()
                    }
                    active={editor.isActive('textStyle', {
                      color: '#dc2626',
                    })}
                    title="Red Text">
                    <span className="text-red-600 font-medium">
                      A
                    </span>
                  </MenuButton>

                  <MenuButton
                    onClick={() =>
                      editor.chain().focus().setColor('#000000').run()
                    }
                    active={editor.isActive('textStyle', {
                      color: '#000000',
                    })}
                    title="Black Text">
                    <span className="font-medium">A</span>
                  </MenuButton>
                </div>
              </div>

              <EditorContent
                editor={editor}
                className="prose max-w-none"
              />
            </div>

            {errors.content && (
              <p className="text-red-500 text-sm mt-2">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Recipients
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                {selectedEmails.length === emails.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {emails.length === 0 ? (
                <p className="text-gray-500 text-sm">
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
                        className="ml-2 text-sm text-gray-700">
                        {email.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEmails.length === 0 && (
              <p className="text-red-500 text-sm mt-2">
                Please select at least one recipient
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              !canSubmit || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            }`}>
            {loading ? 'Sending...' : 'Send Emails'}
          </button>
        </form>
      </div>
    </main>
  );
}
