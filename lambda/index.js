const Alexa = require('ask-sdk-core');
const moment = require("moment");

const PERMISSIONS = ['alexa::alerts:reminders:skill:readwrite'];

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'リマインダーのテストです。毎日何時にリマインドしますか？';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const ReminderIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ReminderIntent';
    },
    async handle(handlerInput) {
        const consentToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
        const hhmm = handlerInput.requestEnvelope.request.intent.slots.hhmm.value;
        console.log(`HHMM: ${hhmm}`);

        switch (handlerInput.requestEnvelope.request.intent.confirmationStatus) {
        // ユーザが確認で了承した
        case 'CONFIRMED':
            console.log('CONFIRMED!');
            break;
        // ユーザが確認で拒否した
        case 'DENIED':
            console.log('DENINED!');
            return handlerInput.responseBuilder
                .speak(`わかりました。リマインドはしないでおきますね。`)
                .withShouldEndSession(true)
                .getResponse();
        // ユーザの確認がない場合は再度確認
        case 'NONE':
        default:
            console.log('NONE....');
            return handlerInput.responseBuilder
                .addDelegateDirective()
                .getResponse();
        }

        let hh, mm;
        switch (hhmm) {
        case 'MO':
            hh = '09'; mm = '00';
            break;
        case 'AF':
            hh = '13'; mm = '00';
            break;
        case 'EV':
            hh = '18'; mm = '00';
            break;
        case 'NI':
            hh = '21'; mm = '00';
            break;
        default:
            [hh, mm] = hhmm.split(":");
        }
        console.log(`HH: ${hh}`);
        console.log(`MM: ${mm}`);
        
        // 権限チェックは初回に実施しているが、念の為
        if (!consentToken) {
            const speechText = 'ごめんなさい、このスキルでは、リマインダーへのアクセス権が必要になります。Alexaアプリのアクティビティーをご確認ください。';
            return handlerInput.responseBuilder
                .speak(speechText)
                .withAskForPermissionsConsentCard(PERMISSIONS)
                .getResponse();
        }
        try {
            const client = handlerInput.serviceClientFactory.getReminderManagementServiceClient();
            
            const remindTime = moment({ hours: hh, minutes: mm}).add(1, 'minutes'); // 繰り返しの場合、未来であれば時間はいつでも良い
            const timeFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';
            console.log('REQUEST_TIME: ' + moment().format(timeFormat));
            console.log('REMIND_TIME: ' + remindTime.format(timeFormat));

            const reminderRequest = {
                requestTime: moment().format(timeFormat),
                trigger: {
                    type: 'SCHEDULED_ABSOLUTE',
                    scheduledTime: remindTime.format(timeFormat),
                    timeZoneId: 'Asia/Tokyo',
                    recurrence: { freq: 'DAILY' },
                },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "ja-JP",
                            text: "リマインダーテストの時間"
                        }]
                    }
                },
                pushNotification: {
                    status: 'ENABLED',
                }
            };
            console.log('REQUEST: ' + JSON.stringify(reminderRequest));
            const reminderResponse = await client.createReminder(reminderRequest);
            console.log('RESPONSE: ' + JSON.stringify(reminderResponse));
        } catch (error) {
            if (error.name !== 'ServiceError') {
                console.log(`error: ${error.stack}`);
                const response = handlerInput.responseBuilder.speak(`すみません。エラーが発生しました。`).getResponse();
                return response;
            }
            throw error;
        }
        
        const speechText = `${hhmm} ですね。わかりました、その時間にリマインダーをセットしておきますね。`;
        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'リマインダーのテストです。毎日リマインドしてほしい時間を言ってください。';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'ご利用ありがとうございました。';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const ErrorHandler = {
  canHandle(handlerInput, error) {
    return error.name === 'ServiceError';
  },
  handle(handlerInput, error) {
    console.log(`ERROR STATUS: ${error.statusCode}`);
    console.log(`ERROR MESSAGE: ${error.message}`);
    console.log(`ERROR RESPONSE: ${JSON.stringify(error.response)}`);
    console.log(`ERROR STACK: ${error.stack}`);
    switch (error.statusCode) {
      case 401:
        return handlerInput.responseBuilder
          .speak('ごめんなさい、このスキルでは、リマインダーへのアクセス権が必要になります。Alexaアプリのアクティビティーをご確認ください。')
          .withAskForPermissionsConsentCard(PERMISSIONS)
          .getResponse();
      case 403:
        return handlerInput.responseBuilder
          .speak(`このデバイスではリマインダーを設定することができません。`)
          .getResponse();
      default:
        return handlerInput.responseBuilder
          .speak(`リマインダーの設定でエラーが発生しました。`)
          .getResponse();
    }
  },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ReminderIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();

