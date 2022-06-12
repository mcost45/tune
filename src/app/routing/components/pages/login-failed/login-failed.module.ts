import { NgModule } from '@angular/core';

import { SharedModule } from '../../../../shared/shared.module';
import { LoginFailedPageRoutingModule } from './login-failed-routing.module';

import { LoginFailedPage } from './login-failed.page';

@NgModule({
	imports: [SharedModule, LoginFailedPageRoutingModule],
	declarations: [LoginFailedPage]
})
export class LoginFailedPageModule {}
