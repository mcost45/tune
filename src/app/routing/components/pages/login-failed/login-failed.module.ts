import { NgModule } from '@angular/core';

import { LoginFailedPageRoutingModule } from './login-failed-routing.module';

import { LoginFailedPage } from './login-failed.page';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
	imports: [SharedModule, LoginFailedPageRoutingModule],
	declarations: [LoginFailedPage]
})
export class LoginFailedPageModule {}
