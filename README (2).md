# Findr Health Flutter - Clarity Package

## Overview

This package provides a complete, self-contained Flutter integration for the Clarity AI healthcare cost guidance platform. It includes:

- **Data Models** - Type-safe Dart classes with JSON serialization
- **API Service** - Complete API client for all Clarity endpoints
- **UI Widgets** - Portable, customizable chat widgets

## Quick Start

### 1. Add Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
```

### 2. Copy Files

Copy the following directories into your Flutter project:
- `lib/models/clarity/` → Your models directory
- `lib/services/api/clarity_api_service.dart` → Your services directory
- `lib/widgets/clarity/` → Your widgets directory

### 3. Basic Usage

```dart
import 'package:your_app/services/api/clarity_api_service.dart';
import 'package:your_app/widgets/clarity/clarity_widgets.dart';
import 'package:your_app/models/clarity/clarity_models.dart';

// Initialize the service
final clarityApi = ClarityApiService();

// Use the full chat widget
ClarityChatWidget(
  apiService: clarityApi,
  location: UserLocation.manual(city: 'Denver', state: 'CO'),
);
```

## Files Overview

### Models (`lib/models/clarity/`)

| File | Purpose |
|------|---------|
| `chat_message.dart` | Chat message with role, content, triggers |
| `chat_triggers.dart` | AI response triggers (calculator, document, location) |
| `calculator_assessment.dart` | Complete calculator results with costs, premiums, risks |
| `document_analysis.dart` | Document analysis results with extracted data |
| `feedback_request.dart` | User feedback submission |
| `user_location.dart` | Location data for pricing context |
| `clarity_models.dart` | Barrel file exporting all models |

### API Service (`lib/services/api/`)

| File | Purpose |
|------|---------|
| `clarity_api_service.dart` | Complete API client for all endpoints |

**Endpoints:**
- `POST /api/clarity/chat` - Send chat message with history
- `POST /api/clarity/analyze` - Analyze healthcare documents
- `POST /api/feedback` - Submit user feedback

### Widgets (`lib/widgets/clarity/`)

| Widget | Purpose |
|--------|---------|
| `ClarityChatWidget` | Full-featured chat interface |
| `ClarityChatMini` | Compact embeddable chat |
| `ChatBubble` | Individual message display |
| `ChatInputField` | Message input with send button |
| `FeedbackButtons` | Thumbs up/down, copy, retry |
| `CalculatorResultsCard` | Calculator results display |
| `DocumentAnalysisCard` | Document analysis display |

## Detailed Usage

### API Service

```dart
final clarityApi = ClarityApiService();

// Send a chat message
final response = await clarityApi.sendMessage(
  message: 'How much should an MRI cost?',
  history: previousMessages,
  location: userLocation,
);

if (response.success) {
  print(response.message);
  print(response.triggers); // Check for calculator/document triggers
}

// Analyze a document
final analysis = await clarityApi.analyzeDocument(
  file: myFile,
  documentType: DocumentType.bill,
);

// Submit feedback
await clarityApi.submitPositiveFeedback(
  messageId: message.id,
  aiResponse: message.content,
  userPrompt: userQuestion,
);
```

### Chat Widget

```dart
// Full chat interface
Scaffold(
  body: ClarityChatWidget(
    apiService: clarityApi,
    location: userLocation,
    onDocumentUpload: () async {
      // Show your file picker here
      return await pickFile();
    },
    welcomeMessage: "Hi! I'm Clarity. Ask me about healthcare costs!",
    title: 'Cost Navigator',
  ),
);

// Compact embeddable version
Container(
  height: 400,
  child: ClarityChatMini(
    apiService: clarityApi,
    location: userLocation,
    hintText: 'Ask about costs...',
  ),
);
```

### Individual Components

```dart
// Chat bubble with actions
ChatBubble(
  message: chatMessage,
  onCopy: () => copyToClipboard(chatMessage.content),
  onThumbsUp: () => submitPositiveFeedback(chatMessage),
  onThumbsDown: () => submitNegativeFeedback(chatMessage),
  onRetry: () => retryMessage(),
);

// Feedback buttons
FeedbackButtons(
  textToCopy: message.content,
  onThumbsUp: () async => await submitFeedback(positive: true),
  onThumbsDown: () async => await submitFeedback(positive: false),
  onRetry: () => retryMessage(),
);

// Calculator results
if (message.hasCalculatorData) {
  CalculatorResultsCard(
    assessment: message.calculatorData!,
    onLearnMore: () => showFullAnalysis(),
  );
}

// Document analysis
DocumentAnalysisCard(
  analysis: analysisResult,
  onAskQuestion: () => askFollowUp(),
);
```

### Working with Location

```dart
// From GPS detection
final location = UserLocation.fromCoordinates(
  latitude: 39.7392,
  longitude: -104.9903,
);
// Needs reverse geocoding to get city/state

// From manual entry
final location = UserLocation.manual(
  city: 'Denver',
  state: 'CO',
  zip: '80202',
);

// Check if location is valid for pricing
if (location.hasLocationData) {
  // Can use for state-specific pricing
}
```

## Integration with Your App

### State Management

These widgets are designed to be state-management agnostic. You can wrap them with Provider, Riverpod, Bloc, or any other solution:

```dart
// With Provider
Provider(
  create: (_) => ClarityApiService(),
  child: Consumer<ClarityApiService>(
    builder: (context, api, _) => ClarityChatWidget(apiService: api),
  ),
);

// With Riverpod
final clarityApiProvider = Provider((ref) => ClarityApiService());

class MyChatScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.watch(clarityApiProvider);
    return ClarityChatWidget(apiService: api);
  }
}
```

### Customization

```dart
ClarityChatWidget(
  apiService: clarityApi,
  
  // Custom colors
  primaryColor: Colors.teal,
  backgroundColor: Colors.grey[50],
  
  // Custom text
  title: 'Healthcare Advisor',
  welcomeMessage: 'Welcome! How can I help with healthcare costs?',
  
  // Hide app bar for embedding
  showAppBar: false,
);
```

### Handling Documents

```dart
ClarityChatWidget(
  apiService: clarityApi,
  onDocumentUpload: () async {
    // Using image_picker package
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      return File(image.path);
    }
    return null;
  },
);
```

## API Reference

### Clarity Backend

**Base URL:** `https://fearless-achievement-production.up.railway.app`

#### Chat Endpoint
```
POST /api/clarity/chat
Content-Type: application/json

Request:
{
  "message": "How much should an MRI cost?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "location": {
    "city": "Denver",
    "state": "CO",
    "zip": "80202"
  }
}

Response:
{
  "success": true,
  "message": "AI response text...",
  "triggers": {
    "calculatorMode": false,
    "documentAnalysis": false,
    "locationNeeded": false
  }
}
```

#### Document Analysis Endpoint
```
POST /api/clarity/analyze
Content-Type: multipart/form-data

Fields:
- file: Document file (image/pdf)
- documentType: "bill" | "eob" | "lab" | "prescription" | "other"

Response:
{
  "success": true,
  "analysis": "Detailed analysis...",
  "documentType": "bill",
  "extractedData": {
    "totalAmount": 1234.56,
    "provider": "Provider Name",
    "lineItems": [...]
  }
}
```

#### Feedback Endpoint
```
POST /api/feedback
Content-Type: application/json

Request:
{
  "messageId": "unique-id",
  "rating": "positive" | "negative",
  "aiResponse": "The AI response",
  "userPrompt": "Original question",
  "sessionId": "session-id",
  "interactionType": "chat" | "document_analysis" | "calculator"
}
```

## Testing

The package includes test-friendly design:

```dart
// Mock the HTTP client
final mockClient = MockClient((request) async {
  return http.Response(
    '{"success": true, "message": "Test response"}',
    200,
  );
});

final api = ClarityApiService(client: mockClient);
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 28, 2025 | Initial release |

## Support

For issues or questions, contact the Findr Health development team.
