/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { APP_BASE_HREF, CommonModule, DOCUMENT } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

import { OverlayModule } from '@angular/cdk/overlay';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { CacheModule, MemoryCacheModule } from '@dagonmetric/ng-cache';
import { ConfigModule } from '@dagonmetric/ng-config';
import { FirebaseRemoteConfigProviderModule } from '@dagonmetric/ng-config-firebase-remote-config';
import { LogModule } from '@dagonmetric/ng-log';
import { ConsoleLoggerModule } from '@dagonmetric/ng-log/console';
import { TranslitModule } from '@dagonmetric/ng-translit';

import { ZawgyiDetectorModule } from '@myanmartools/ng-zawgyi-detector';

import { environment } from '../environments/environment';

import { CdkTextareaSyncSizeModule } from '../modules/cdk-extensions';
import { CustomIconRegistry } from '../modules/mat-extensions';
import { LinkService } from '../modules/seo';
import { ZgUniTranslitRuleLoaderModule } from '../modules/zg-uni-translit-rule-loader';

import { UrlHelper } from './shared/url-helper';

import { SocialSharingSheetComponent } from './shared/social-sharing-sheet';

import { AboutComponent, AboutDialogHandlerComponent } from './about';
import { HomeComponent } from './home';
import { PrivacyComponent, PrivacyDialogHandlerComponent } from './privacy';
import { SupportComponent, SupportDialogHandlerComponent } from './support';

import { AppComponent } from './app.component';
import { appSvgIconProviders } from './app.svg-icons';

export const appId = 'zawgyi-unicode-converter-pwa';

export const appRoutes: Routes = [
    {
        path: '',
        component: HomeComponent,
        // pathMatch: 'full',
        data: {
            pageType: 'home-page',
            meta: {
                keywords:
                    'zawgyi unicode converter,zawgyi unicode converter online,zawgyi,zawgyi to unicode,unicode to zawgyi,zawgyi unicode,myanmar font converter,myanmar tools,myanmar,unicode,converter,dagonmetric',
                socialTitle: "Let's Convert Zawgyi / Unicode Effortlessly",
                socialDescription:
                    "Free, open source and the world's most intelligent accurate Zawgyi Unicode converter is here!"
            }
        },
        children: [
            {
                path: 'about',
                component: AboutDialogHandlerComponent,
                data: {
                    pageType: 'about-page',
                    meta: {
                        title: 'Zawgyi Unicode Converter - About',
                        description:
                            "The world's most intelligent and accurate Zawgyi Unicode converter like never before!",
                        keywords: 'zawgyi unicode converter,free,open source,intelligent,accurate,about'
                    }
                }
            },
            {
                path: 'support',
                component: SupportDialogHandlerComponent,
                data: {
                    pageType: 'support-page',
                    meta: {
                        title: 'Zawgyi Unicode Converter - Support',
                        description:
                            'We use the following channels for general feedback and discussions. Facebook Messenger Gitter GitHub Issues',
                        keywords: 'zawgyi unicode converter,support,feedback'
                    }
                }
            },
            {
                path: 'privacy',
                component: PrivacyDialogHandlerComponent,
                data: {
                    pageType: 'privacy-page',
                    meta: {
                        title: 'Zawgyi Unicode Converter - Privacy',
                        description:
                            'Please read our privacy policy carefully to get a clear understanding of how we collect, use, protect or handle your Personally Identifiable Information with this app - Zawgyi Unicode Converter.',
                        keywords: 'zawgyi unicode converter,privacy'
                    }
                }
            }
        ]
    },
    { path: '**', redirectTo: '' }
];

export function baseHrefFactory(doc: Document): string | null | undefined {
    // return document.getElementsByTagName('base')[0].href;

    if (doc && doc.head) {
        const baseEle = doc.head.querySelector('base');

        if (baseEle) {
            return baseEle.getAttribute('href');
        }
    }

    return undefined;
}

/**
 * App shared module for server, browser and test platforms.
 */
@NgModule({
    declarations: [
        AppComponent,
        AboutComponent,
        AboutDialogHandlerComponent,
        HomeComponent,
        PrivacyComponent,
        PrivacyDialogHandlerComponent,
        SupportComponent,
        SupportDialogHandlerComponent,
        SocialSharingSheetComponent
    ],
    imports: [
        CommonModule,
        FormsModule,

        RouterModule.forRoot(appRoutes),

        OverlayModule,
        FlexLayoutModule,
        MatBottomSheetModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatDialogModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatToolbarModule,

        CdkTextareaSyncSizeModule,

        // ng-config modules
        ConfigModule.configure(true, {
            debug: !environment.production
        }),
        FirebaseRemoteConfigProviderModule.configure({
            firebaseConfig: environment.firebase,
            remoteConfigSettings: {
                minimumFetchIntervalMillis: environment.production ? 43200000 : 30000,
                fetchTimeoutMillis: environment.production ? 30000 : 60000
            },
            throwIfLoadError: environment.production ? false : true
        }),

        // ng-log modules
        LogModule.withConfig({
            minLevel: environment.production ? 'warn' : 'trace'
        }),
        ConsoleLoggerModule.withOptions({
            enableDebug: !environment.production
        }),

        // ng-cache modules
        CacheModule,
        MemoryCacheModule,

        // ng-translit module
        TranslitModule,

        // ng-translit rule loader
        ZgUniTranslitRuleLoaderModule,

        // ng-zawgyi-detector module
        ZawgyiDetectorModule,

        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: baseHrefFactory,
            deps: [DOCUMENT]
        },
        LinkService,
        UrlHelper,
        {
            provide: MatIconRegistry,
            useClass: CustomIconRegistry
        },
        appSvgIconProviders
    ],
    entryComponents: [AboutComponent, PrivacyComponent, SupportComponent, SocialSharingSheetComponent],
    bootstrap: [AppComponent]
})
export class AppModule {}
