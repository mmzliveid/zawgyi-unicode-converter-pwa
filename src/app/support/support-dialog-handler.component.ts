/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';

import { SupportComponent } from './support.component';

/**
 * App Support dialog handler component.
 */
@Component({
    template: ''
})
export class SupportDialogHandlerComponent {
    constructor(
        private readonly _dialog: MatDialog,
        private readonly _router: Router,
        private readonly _route: ActivatedRoute
    ) {
        this.openDialog();
    }

    openDialog(): void {
        const dialogRef = this._dialog.open(SupportComponent);

        dialogRef.afterClosed().subscribe(() => {
            void this._router.navigate(['../'], { relativeTo: this._route });
        });
    }
}
