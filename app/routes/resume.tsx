import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    { title: 'Resumind | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { auth, isLoading, fs, kv, puterReady } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Removed auto-redirect to prevent loops. Will handle unauthenticated state in render.
    // useEffect(() => {
    //     if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    // }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            if (!puterReady) return;

            const resume = await kv.get(`resume:${id}`);

            if (!resume) {
                setError("Resume not found");
                return;
            }

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumePath);
            if (!resumeBlob) {
                setError("Failed to load resume file");
                return;
            }

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if (!imageBlob) {
                setError("Failed to load resume image");
                return;
            };
            const imageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback);
            console.log({ resumeUrl, imageUrl, feedback: data.feedback });
        }

        loadResume();
    }, [id, puterReady]);

    if (error) {
        return (
            <main className="!pt-0">
                <nav className="resume-nav">
                    <Link to="/" className="back-button">
                        <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                        <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                    </Link>
                </nav>
                <div className="flex flex-col items-center justify-center h-[90vh]">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Resume</h2>
                    <p className="text-gray-600">{error}</p>
                    <Link to="/" className="mt-8 primary-button">Go Home</Link>
                </div>
            </main>
        )
    }

    if (!isLoading && !auth.isAuthenticated) {
        return (
            <main className="!pt-0">
                <nav className="resume-nav">
                    <Link to="/" className="back-button">
                        <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                        <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                    </Link>
                </nav>
                <div className="flex flex-col items-center justify-center h-[90vh] gap-6">
                    <h2 className="text-2xl font-bold">Authentication Required</h2>
                    <p className="text-gray-600">Please log in to view your resume analysis.</p>
                    <Link
                        to={`/auth?next=/resume/${id}`}
                        className="primary-button"
                    >
                        Log In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-w-xl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <img src="/images/resume-scan-2.gif" className="w-full" />
                            <p className="text-gray-500 animate-pulse">Loading analysis...</p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume