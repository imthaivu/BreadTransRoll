import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Word } from "../types";

interface CompletionScreenProps {
  deckLength: number;
  score: number;
  wrongWords: Word[];
  onRestart: () => void;
  onClose: () => void;
}

export const CompletionScreen = ({
  deckLength,
  score,
  wrongWords,
  onRestart,
  onClose,
}: CompletionScreenProps) => {
  const accuracy = deckLength > 0 ? Math.round((score / deckLength) * 100) : 0;

  return (
    <Card className="p-2 sm:p-4 mb-4 border-green-200 bg-green-50 shadow-none">
      <div className="text-center">
        <div className="text-green-600 text-4xl mb-2">🎉</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Hoàn thành!
        </h3>
        <p className="text-green-600 mb-4">
          Bạn đã hoàn thành {deckLength} từ vựng
        </p>
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{score}</div>
            <div className="text-sm md:text-base text-gray-600">Từ đúng</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
            <div className="text-sm md:text-base text-gray-600">
              Độ chính xác
            </div>
          </div>
        </div>

        {/* Wrong Words */}
        {wrongWords.length > 0 && (
          <div className="mt-2 sm:mt-4 p-2 sm:p-4 bg-primary rounded-lg">
            <h4 className="font-semibold text-black mb-2">{`Cần ôn ${wrongWords.length} từ:`}</h4>
            <div className="text-sm md:text-base text-black">
              {wrongWords.map((word, index) => (
                <div key={index} className="mb-1">
                  <strong>{word.word}</strong> ({word.ipa}) → {word.mean}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-2 sm:mt-4">
          <Button
            onClick={onRestart}
            className="px-6 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            🔄 Học lại
          </Button>
          <Button onClick={onClose} variant="outline" className="px-6 py-2">
            🏠 Về trang chủ
          </Button>
        </div>
      </div>
    </Card>
  );
};
