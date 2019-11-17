
/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';

import { of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

import { CacheService } from '@dagonmetric/ng-cache';
import { ConfigService } from '@dagonmetric/ng-config';
import { LogService } from '@dagonmetric/ng-log';
import { TranslitResult, TranslitService } from '@dagonmetric/ng-translit';

import { DetectedEnc, ZawgyiDetector } from '@myanmartools/ng-zawgyi-detector';

import { CdkTextareaSyncSize } from '../../modules/cdk-extensions';

import { AppConfig } from '../shared/app-config';

export type SourceEnc = 'auto' | DetectedEnc;

/**
 * App home page component.
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnInit, OnDestroy {
    autoEncText = 'AUTO';
    sourceEnc?: SourceEnc;
    targetEnc?: DetectedEnc;
    hideAboutSection = false;

    @ViewChild('sourceTextareaSyncSize', { static: false })
    sourceTextareaSyncSize?: CdkTextareaSyncSize;

    @ViewChild('outTextareaSyncSize', { static: false })
    outTextareaSyncSize?: CdkTextareaSyncSize;

    private readonly _translitSubject = new Subject<string>();
    private readonly _destroyed = new Subject<void>();
    private readonly _isBrowser: boolean;

    private _sourceText = '';
    private _outText = '';

    private _detectedEnc: DetectedEnc = null;
    private _curRuleName = '';
    private _autoSaveEnabled?: boolean | null = null;

    get detectedEnc(): DetectedEnc {
        return this._detectedEnc;
    }

    get sourceText(): string {
        return this._sourceText;
    }
    set sourceText(value: string) {
        this._sourceText = value;
        this.translitNext();
    }

    get autoSaveEnabled(): boolean {
        this._autoSaveEnabled = this._cacheService.getItem<boolean>('autoSaveEnabled');

        return this._autoSaveEnabled == null ? true : this._autoSaveEnabled;
    }
    set autoSaveEnabled(value: boolean) {
        this._autoSaveEnabled = value;
        this._cacheService.setItem('autoSaveEnabled', value);

        this._logService.trackEvent({
            name: 'change_auto_save',
            properties: {
                is_auto_save: value,
                app_version: this._appConfig.appVersion
            }
        });
    }

    get outText(): string {
        return this._outText;
    }

    get appVersion(): string | undefined {
        return this._appConfig.appVersion;
    }

    get appDescription(): string | undefined {
        return this._appConfig.appDescription;
    }

    get sourcePlaceholderText(): string {
        return this._sourcePlaceholderText || this._sourcePlaceholderAuto;
    }

    get targetPlaceholderText(): string {
        return this._targetPlaceholderText || this._targetPlaceholderAuto;
    }

    private readonly _appConfig: AppConfig;
    private readonly _sourcePlaceholderAuto = 'Enter Zawgyi or Unicode text here';
    private readonly _sourcePlaceholderZg = 'Enter Zawgyi text here';
    private readonly _sourcePlaceholderUni = 'Enter Unicode text here';

    private readonly _targetPlaceholderAuto = 'Converted text will be appeared here';
    private readonly _targetPlaceholderZg = 'Converted Zawgyi text will be appeared here';
    private readonly _targetPlaceholderUni = 'Converted Unicode text will be appeared here';

    private readonly _lastInputTextKey = 'last_input_text';

    private _sourcePlaceholderText = '';
    private _targetPlaceholderText = '';

    constructor(
        @Inject(PLATFORM_ID) platformId: Object,
        private readonly _translitService: TranslitService,
        private readonly _zawgyiDetector: ZawgyiDetector,
        private readonly _logService: LogService,
        private readonly _cacheService: CacheService,
        configService: ConfigService) {
        this._isBrowser = isPlatformBrowser(platformId);
        this._appConfig = configService.getValue<AppConfig>('app');

        const appUsedCount = this.getAppUsedCount();
        if (appUsedCount && appUsedCount > 1) {
            this.hideAboutSection = true;
        }
    }

    ngOnInit(): void {
        this._translitSubject.pipe(
            debounceTime(100),
            distinctUntilChanged(),
            takeUntil(this._destroyed),
            switchMap(formattedInput => {
                const inputPart = formattedInput.substr(formattedInput.indexOf('|'));
                const input = inputPart.length > 1 ? inputPart.substr(1) : '';
                if (!input || !input.trim().length) {
                    if (this.sourceEnc === 'auto' || !this.detectedEnc) {
                        this.resetAutoEncText();
                        this.sourceEnc = 'auto';
                        this._detectedEnc = null;
                    }

                    return of({
                        outputText: input,
                        replaced: false,
                        duration: 0
                    });
                }

                if (this.sourceEnc === 'auto' || !this.detectedEnc) {
                    const detectorResult = this._zawgyiDetector.detect(input, { detectMixType: false });

                    if (detectorResult.detectedEnc === 'zg') {
                        this.resetAutoEncText('ZAWGYI DETECTED');
                        this.sourceEnc = 'auto';
                        this._detectedEnc = 'zg';
                        this.targetEnc = 'uni';
                    } else if (detectorResult.detectedEnc === 'uni') {
                        this.resetAutoEncText('UNICODE DETECTED');
                        this.sourceEnc = 'auto';
                        this._detectedEnc = 'uni';
                        this.targetEnc = 'zg';
                    } else {
                        this.resetAutoEncText();
                        this.sourceEnc = 'auto';
                        this._detectedEnc = null;

                        return of({
                            replaced: false,
                            outputText: input,
                            duration: 0
                        });
                    }
                }

                this._curRuleName = this.detectedEnc === 'zg' ? 'zg2uni' : 'uni2zg';

                return this._translitService.translit(input, this._curRuleName)
                    .pipe(
                        takeUntil(this._destroyed)
                    );
            })
        ).subscribe((result: TranslitResult) => {
            this._outText = result.outputText || '';
            if (!this.hideAboutSection) {
                this.hideAboutSection = true;
            }

            if (this._isBrowser && this.autoSaveEnabled) {
                this._cacheService.setItem(this._lastInputTextKey, this._sourceText);
            }

            if (this._isBrowser && this._sourceText.length && this._curRuleName && result.replaced) {
                this._logService.trackEvent({
                    name: 'convert',
                    properties: {
                        method: this._curRuleName,
                        input_length: this._sourceText.length,
                        duration_msec: result.duration,
                        app_version: this._appConfig.appVersion
                    }
                });
            }
        });

        if (this._isBrowser && this.autoSaveEnabled) {
            const lastSavedText = this._cacheService.getItem<string>(this._lastInputTextKey);
            if (lastSavedText && lastSavedText.length && lastSavedText.trim().length) {
                this.sourceText = lastSavedText;
            }
        }
    }

    ngAfterViewInit(): void {
        if (this.sourceTextareaSyncSize) {
            this.sourceTextareaSyncSize.secondCdkTextareaSyncSize = this.outTextareaSyncSize;
        }
        if (this.outTextareaSyncSize) {
            this.outTextareaSyncSize.secondCdkTextareaSyncSize = this.sourceTextareaSyncSize;
        }
    }

    ngOnDestroy(): void {
        this._destroyed.next();
        this._destroyed.complete();
    }

    onSourceEncChanged(val: SourceEnc): void {
        this.sourceEnc = val;

        if (val === 'uni' || val === 'zg') {
            this._detectedEnc = val;

            if (val === 'zg') {
                this._sourcePlaceholderText = this._sourcePlaceholderZg;
                this._targetPlaceholderText = this._targetPlaceholderUni;
            } else {
                this._sourcePlaceholderText = this._sourcePlaceholderUni;
                this._targetPlaceholderText = this._targetPlaceholderZg;
            }
        } else {
            this._detectedEnc = null;
            this.targetEnc = null;

            this._sourcePlaceholderText = this._sourcePlaceholderAuto;
            this._targetPlaceholderText = this._targetPlaceholderAuto;
        }

        if (this.sourceEnc === 'zg' && (!this.targetEnc || this.targetEnc === 'zg')) {
            this.targetEnc = 'uni';
            this.resetAutoEncText();
        } else if (this.sourceEnc === 'uni' && (!this.targetEnc || this.targetEnc === 'uni')) {
            this.resetAutoEncText();

            this.targetEnc = 'zg';
        }

        this._logService.trackEvent({
            name: 'change_input_font_enc',
            properties: {
                font_enc: this.sourceEnc,
                app_version: this._appConfig.appVersion
            }
        });

        this.translitNext();
    }

    onTargetEncChanged(val: DetectedEnc): void {
        this.targetEnc = val;

        if (val === 'zg') {
            this._sourcePlaceholderText = this._sourcePlaceholderUni;
            this._targetPlaceholderText = this._targetPlaceholderZg;
        } else {
            this._sourcePlaceholderText = this._sourcePlaceholderZg;
            this._targetPlaceholderText = this._targetPlaceholderUni;
        }

        if (this.targetEnc === 'zg' && (!this.sourceEnc || this.sourceEnc === 'auto' || this.sourceEnc === 'zg')) {
            this._detectedEnc = this.sourceEnc = 'uni';
            this.resetAutoEncText();
        } else if (this.targetEnc === 'uni' && (!this.sourceEnc || this.sourceEnc === 'auto' || this.sourceEnc === 'uni')) {
            this._detectedEnc = this.sourceEnc = 'zg';
            this.resetAutoEncText();
        }

        this._logService.trackEvent({
            name: 'change_output_font_enc',
            properties: {
                font_enc: this.targetEnc,
                app_version: this._appConfig.appVersion
            }
        });

        this.translitNext();
    }

    private resetAutoEncText(text?: string): void {
        this.autoEncText = text || 'AUTO';
    }

    private translitNext(): void {
        this._translitSubject.next(`${this.sourceEnc},${this.targetEnc}|${this.sourceText}`);
    }

    private getAppUsedCount(): number | null {
        if (!this._isBrowser) {
            return null;
        }

        try {
            const str = this._cacheService.getItem<string>(`appUsedCount-v${this.appVersion}`);
            if (!str) {
                return null;
            }

            return parseInt(str, 10);
        } catch (err) {
            // Do nothing
        }

        return null;
    }
}
